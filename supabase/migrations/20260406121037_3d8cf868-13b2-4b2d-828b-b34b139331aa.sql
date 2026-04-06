
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
  IF (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()) IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Create org
  INSERT INTO public.organizations (id, name, industry, gst_number, phone)
  VALUES (_org_id, _org_name, _industry, _gst_number, _phone);

  -- Update profile
  UPDATE public.profiles SET org_id = _org_id WHERE user_id = auth.uid();

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
