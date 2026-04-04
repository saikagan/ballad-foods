
ALTER TABLE public.orders ADD COLUMN invoice_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Anyone can view invoices"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'invoices');
