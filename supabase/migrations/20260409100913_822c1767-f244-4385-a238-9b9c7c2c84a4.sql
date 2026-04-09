
-- Drop existing insert/update policies
DROP POLICY IF EXISTS "Admins/managers can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins/managers can update menu items" ON public.menu_items;

-- Recreate with cashier included
CREATE POLICY "Admins/managers/cashiers can insert menu items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  (org_id = get_user_org_id(auth.uid()))
  AND (
    has_role(auth.uid(), 'admin'::app_role, org_id)
    OR has_role(auth.uid(), 'manager'::app_role, org_id)
    OR has_role(auth.uid(), 'cashier'::app_role, org_id)
  )
);

CREATE POLICY "Admins/managers/cashiers can update menu items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  (org_id = get_user_org_id(auth.uid()))
  AND (
    has_role(auth.uid(), 'admin'::app_role, org_id)
    OR has_role(auth.uid(), 'manager'::app_role, org_id)
    OR has_role(auth.uid(), 'cashier'::app_role, org_id)
  )
);
