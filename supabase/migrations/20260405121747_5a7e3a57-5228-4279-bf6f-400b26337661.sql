-- Add UPDATE and DELETE policies for invoices storage bucket
CREATE POLICY "Org users can update invoices"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  );

CREATE POLICY "Org users can delete invoices"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  );