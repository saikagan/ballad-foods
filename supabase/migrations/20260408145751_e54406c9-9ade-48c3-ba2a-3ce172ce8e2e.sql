
CREATE OR REPLACE FUNCTION public.setup_onboarding(
  _org_id uuid,
  _org_name text,
  _industry industry_type,
  _gst_number text DEFAULT NULL::text,
  _phone text DEFAULT NULL::text,
  _industries industry_type[] DEFAULT NULL::industry_type[],
  _join_existing boolean DEFAULT false
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _existing_org_id uuid;
BEGIN
  -- Verify caller has no org yet
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Check if an org with this name already exists (case-insensitive)
  SELECT id INTO _existing_org_id
  FROM public.organizations
  WHERE lower(trim(name)) = lower(trim(_org_name))
  LIMIT 1;

  IF _existing_org_id IS NOT NULL AND NOT _join_existing THEN
    -- Signal to the client that a duplicate exists
    RAISE EXCEPTION 'ORG_EXISTS:%', _existing_org_id;
  END IF;

  IF _existing_org_id IS NOT NULL AND _join_existing THEN
    -- Join existing org as admin
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
    VALUES (auth.uid(), 'admin'::app_role, _existing_org_id);
  ELSE
    -- Create new org
    INSERT INTO public.organizations (id, name, industry, gst_number, phone)
    VALUES (_org_id, _org_name, _industry, _gst_number, _phone);

    -- Assign profile with org
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

    -- Always assign admin role for org creator
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (auth.uid(), 'admin'::app_role, _org_id);

    -- Insert industries
    IF _industries IS NOT NULL AND array_length(_industries, 1) > 0 THEN
      INSERT INTO public.organization_industries (org_id, industry)
      SELECT _org_id, unnest(_industries);
    END IF;
  END IF;
END;
$$;
