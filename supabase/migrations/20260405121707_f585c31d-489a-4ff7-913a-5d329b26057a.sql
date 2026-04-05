-- 1. Fix profiles UPDATE policy: correct self-referencing condition
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      org_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.org_id = profiles.org_id
      )
    )
  );

-- 2. Fix organization_industries INSERT policy: remove unscoped NULL org branch
DROP POLICY IF EXISTS "Users can insert org industries" ON public.organization_industries;
CREATE POLICY "Users can insert org industries"
  ON public.organization_industries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
  );