DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;
CREATE POLICY "Users can view own or org profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR org_id = public.get_user_org_id(auth.uid())
);

DROP POLICY IF EXISTS "Users can view roles in their org" ON public.user_roles;
CREATE POLICY "Users can view own or org roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR org_id = public.get_user_org_id(auth.uid())
);