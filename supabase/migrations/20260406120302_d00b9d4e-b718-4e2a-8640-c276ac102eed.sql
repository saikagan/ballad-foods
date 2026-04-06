ALTER TABLE public.order_items
  DROP CONSTRAINT order_items_menu_item_id_fkey,
  ADD CONSTRAINT order_items_menu_item_id_fkey
    FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
  ALTER COLUMN menu_item_id DROP NOT NULL;