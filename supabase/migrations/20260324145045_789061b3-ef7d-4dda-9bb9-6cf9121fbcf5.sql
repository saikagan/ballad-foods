
-- Allow authenticated users to create organizations (for onboarding)
CREATE POLICY "Authenticated users can create orgs" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to insert roles for themselves in their org
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
