
CREATE OR REPLACE FUNCTION public.setup_onboarding(
  _org_id uuid,
  _org_name text,
  _industry industry_type,
  _gst_number text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _industries industry_type[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has no org yet
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Create org
  INSERT INTO public.organizations (id, name, industry, gst_number, phone)
  VALUES (_org_id, _org_name, _industry, _gst_number, _phone);

  -- Upsert profile (create if missing, update if exists)
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

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (auth.uid(), 'admin'::app_role, _org_id);

  -- Insert industries
  IF _industries IS NOT NULL AND array_length(_industries, 1) > 0 THEN
    INSERT INTO public.organization_industries (org_id, industry)
    SELECT _org_id, unnest(_industries);
  END IF;
END;
$$;
