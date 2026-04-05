
-- 1. Remove the dangerous "Users can insert own role" policy
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- 2. Make invoices bucket private
UPDATE storage.buckets SET public = false WHERE id = 'invoices';

-- 3. Drop the overly permissive public SELECT policy on storage.objects
DROP POLICY IF EXISTS "Anyone can view invoices" ON storage.objects;

-- 4. Add org-scoped SELECT policy for invoices (authenticated only)
CREATE POLICY "Org users can view invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  );

-- 5. Drop the unscoped upload policy
DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;

-- 6. Add org-scoped INSERT policy for invoices
CREATE POLICY "Org users can upload invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  );

-- 7. Tighten organizations INSERT policy (only allow if user has no org yet)
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_org_id(auth.uid()) IS NULL
  );
