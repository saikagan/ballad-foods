-- 1. Replace has_role with org-scoped version (no profiles join)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _org_id uuid DEFAULT NULL)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (_org_id IS NULL OR ur.org_id = _org_id)
  );
$$;

-- 2. Update menu_items policies
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
CREATE POLICY "Admins can delete menu items" ON public.menu_items
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, org_id));

DROP POLICY IF EXISTS "Admins/managers can insert menu items" ON public.menu_items;
CREATE POLICY "Admins/managers can insert menu items" ON public.menu_items
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role, org_id) OR has_role(auth.uid(), 'manager'::app_role, org_id)));

DROP POLICY IF EXISTS "Admins/managers can update menu items" ON public.menu_items;
CREATE POLICY "Admins/managers can update menu items" ON public.menu_items
  FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role, org_id) OR has_role(auth.uid(), 'manager'::app_role, org_id)));

-- 3. Update organization_industries policy
DROP POLICY IF EXISTS "Admins can manage org industries" ON public.organization_industries;
CREATE POLICY "Admins can manage org industries" ON public.organization_industries
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, org_id));

-- 4. Update organizations policy
DROP POLICY IF EXISTS "Admins can update their org" ON public.organizations;
CREATE POLICY "Admins can update their org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, id));

-- 5. Update user_roles policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role, org_id));