
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
  _org_name text;
  _industries jsonb;
  _ind text;
BEGIN
  _org_name := NEW.raw_user_meta_data->>'org_name';
  _industries := NEW.raw_user_meta_data->'industries';

  IF _org_name IS NOT NULL AND _org_name != '' THEN
    _org_id := gen_random_uuid();

    -- Create org with primary industry
    INSERT INTO public.organizations (id, name, industry)
    VALUES (_org_id, _org_name, COALESCE((_industries->>0)::industry_type, 'other'::industry_type));

    -- Create profile with org
    INSERT INTO public.profiles (user_id, full_name, org_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', _org_id);

    -- Create admin role
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (NEW.id, 'admin'::app_role, _org_id);

    -- Insert industries
    IF _industries IS NOT NULL AND jsonb_array_length(_industries) > 0 THEN
      FOR _ind IN SELECT jsonb_array_elements_text(_industries)
      LOOP
        INSERT INTO public.organization_industries (org_id, industry)
        VALUES (_org_id, _ind::industry_type);
      END LOOP;
    END IF;
  ELSE
    -- Just create profile without org (old behavior)
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  END IF;

  RETURN NEW;
END;
$$;
