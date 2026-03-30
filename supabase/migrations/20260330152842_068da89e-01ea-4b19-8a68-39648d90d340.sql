
-- Function to search organizations by name (for joining during sign-up)
CREATE OR REPLACE FUNCTION public.search_organizations(_query text)
RETURNS TABLE(id uuid, name text, industry industry_type)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.industry
  FROM public.organizations o
  WHERE o.name ILIKE '%' || _query || '%'
  LIMIT 20;
$$;

-- Update handle_new_user to support joining existing org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _org_name text;
  _join_org_id uuid;
  _industries jsonb;
  _ind text;
BEGIN
  _org_name := NEW.raw_user_meta_data->>'org_name';
  _join_org_id := (NEW.raw_user_meta_data->>'join_org_id')::uuid;
  _industries := NEW.raw_user_meta_data->'industries';

  IF _join_org_id IS NOT NULL THEN
    -- Joining existing org
    INSERT INTO public.profiles (user_id, full_name, org_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', _join_org_id);

    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (NEW.id, 'cashier'::app_role, _join_org_id);

  ELSIF _org_name IS NOT NULL AND _org_name != '' THEN
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
  ELSE
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  END IF;

  RETURN NEW;
END;
$$;
