ALTER TABLE public.orders DROP CONSTRAINT orders_created_by_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;