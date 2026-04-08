
-- Update handle_new_user to auto-match existing org by name
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
  _org_name text;
  _join_org_id uuid;
  _industries jsonb;
  _ind text;
  _existing_org_id uuid;
BEGIN
  _org_name := NEW.raw_user_meta_data->>'org_name';
  _join_org_id := (NEW.raw_user_meta_data->>'join_org_id')::uuid;
  _industries := NEW.raw_user_meta_data->'industries';

  IF _join_org_id IS NOT NULL THEN
    -- Joining existing org by ID
    INSERT INTO public.profiles (user_id, full_name, org_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', _join_org_id);

    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (NEW.id, 'cashier'::app_role, _join_org_id);

  ELSIF _org_name IS NOT NULL AND _org_name != '' THEN
    -- Check if an org with this name already exists (case-insensitive)
    SELECT o.id INTO _existing_org_id
    FROM public.organizations o
    WHERE lower(trim(o.name)) = lower(trim(_org_name))
    LIMIT 1;

    IF _existing_org_id IS NOT NULL THEN
      -- Join existing org as cashier
      INSERT INTO public.profiles (user_id, full_name, org_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', _existing_org_id);

      INSERT INTO public.user_roles (user_id, role, org_id)
      VALUES (NEW.id, 'cashier'::app_role, _existing_org_id);
    ELSE
      -- Create new org
      _org_id := gen_random_uuid();

      INSERT INTO public.organizations (id, name, industry)
      VALUES (_org_id, _org_name, COALESCE((_industries->>0)::industry_type, 'other'::industry_type));

      INSERT INTO public.profiles (user_id, full_name, org_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', _org_id);

      INSERT INTO public.user_roles (user_id, role, org_id)
      VALUES (NEW.id, 'admin'::app_role, _org_id);

      IF _industries IS NOT NULL AND jsonb_array_length(_industries) > 0 THEN
        FOR _ind IN SELECT jsonb_array_elements_text(_industries)
        LOOP
          INSERT INTO public.organization_industries (org_id, industry)
          VALUES (_org_id, _ind::industry_type);
        END LOOP;
      END IF;
    END IF;
  ELSE
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  END IF;

  RETURN NEW;
END;
$function$;

-- Update setup_onboarding to auto-match existing org by name
CREATE OR REPLACE FUNCTION public.setup_onboarding(_org_id uuid, _org_name text, _industry industry_type, _gst_number text DEFAULT NULL::text, _phone text DEFAULT NULL::text, _industries industry_type[] DEFAULT NULL::industry_type[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _existing_org_id uuid;
BEGIN
  -- Verify caller has no org yet
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Check if an org with this name already exists (case-insensitive)
  SELECT o.id INTO _existing_org_id
  FROM public.organizations o
  WHERE lower(trim(o.name)) = lower(trim(_org_name))
  LIMIT 1;

  IF _existing_org_id IS NOT NULL THEN
    -- Join existing org as cashier
    INSERT INTO public.profiles (user_id, full_name, org_id)
    VALUES (
      auth.uid(),
      COALESCE(
        (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()),
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid())
      ),
      _existing_org_id
    )
    ON CONFLICT (user_id) DO UPDATE SET org_id = _existing_org_id;

    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (auth.uid(), 'cashier'::app_role, _existing_org_id);
  ELSE
    -- Create new org
    INSERT INTO public.organizations (id, name, industry, gst_number, phone)
    VALUES (_org_id, _org_name, _industry, _gst_number, _phone);

    INSERT INTO public.profiles (user_id, full_name, org_id)
    VALUES (
      auth.uid(),
      COALESCE(
        (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()),
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid())
      ),
      _org_id
    )
    ON CONFLICT (user_id) DO UPDATE SET org_id = _org_id;

    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (auth.uid(), 'admin'::app_role, _org_id);

    IF _industries IS NOT NULL AND array_length(_industries, 1) > 0 THEN
      INSERT INTO public.organization_industries (org_id, industry)
      SELECT _org_id, unnest(_industries);
    END IF;
  END IF;
END;
$function$;
