
-- Drop the old 6-param overload that conflicts
DROP FUNCTION IF EXISTS public.setup_onboarding(uuid, text, industry_type, text, text, industry_type[]);

-- Recreate the single correct version with _join_existing parameter
CREATE OR REPLACE FUNCTION public.setup_onboarding(
  _org_id uuid,
  _org_name text,
  _industry industry_type,
  _gst_number text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _industries industry_type[] DEFAULT NULL,
  _join_existing boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _existing_org_id uuid;
  _caller_id uuid := auth.uid();
BEGIN
  -- Verify caller has no org yet
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _caller_id AND org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Check if an org with this name already exists (case-insensitive)
  SELECT id INTO _existing_org_id
  FROM public.organizations
  WHERE lower(trim(name)) = lower(trim(_org_name))
  LIMIT 1;

  IF _existing_org_id IS NOT NULL AND NOT _join_existing THEN
    RAISE EXCEPTION 'ORG_EXISTS:%', _existing_org_id;
  END IF;

  IF _existing_org_id IS NOT NULL AND _join_existing THEN
    -- Join existing org as admin — update existing profile or insert
    UPDATE public.profiles SET org_id = _existing_org_id WHERE user_id = _caller_id;
    IF NOT FOUND THEN
      INSERT INTO public.profiles (user_id, full_name, org_id)
      VALUES (
        _caller_id,
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = _caller_id),
        _existing_org_id
      );
    END IF;

    -- Delete any old roles and assign admin
    DELETE FROM public.user_roles WHERE user_id = _caller_id;
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (_caller_id, 'admin'::app_role, _existing_org_id);
  ELSE
    -- Create new org
    INSERT INTO public.organizations (id, name, industry, gst_number, phone)
    VALUES (_org_id, _org_name, _industry, _gst_number, _phone);

    -- Update existing profile or insert
    UPDATE public.profiles SET org_id = _org_id WHERE user_id = _caller_id;
    IF NOT FOUND THEN
      INSERT INTO public.profiles (user_id, full_name, org_id)
      VALUES (
        _caller_id,
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = _caller_id),
        _org_id
      );
    END IF;

    -- Always assign admin role for org creator
    DELETE FROM public.user_roles WHERE user_id = _caller_id;
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (_caller_id, 'admin'::app_role, _org_id);

    -- Insert industries
    IF _industries IS NOT NULL AND array_length(_industries, 1) > 0 THEN
      INSERT INTO public.organization_industries (org_id, industry)
      SELECT _org_id, unnest(_industries);
    END IF;
  END IF;
END;
$$;
