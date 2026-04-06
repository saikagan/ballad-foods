
-- Drop the dangerous 2-param has_role overload that joins profiles
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Make invoices bucket private (was public, exposing sensitive financial data)
UPDATE storage.buckets SET public = false WHERE id = 'invoices';
