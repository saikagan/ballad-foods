
-- Junction table for multi-industry support
CREATE TABLE public.organization_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  industry public.industry_type NOT NULL,
  UNIQUE(org_id, industry)
);

ALTER TABLE public.organization_industries ENABLE ROW LEVEL SECURITY;

-- Users can view their org's industries
CREATE POLICY "Users can view org industries"
  ON public.organization_industries FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()));

-- Authenticated users can insert (for onboarding)
CREATE POLICY "Users can insert org industries"
  ON public.organization_industries FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NULL
  ));

-- Admins can manage industries
CREATE POLICY "Admins can manage org industries"
  ON public.organization_industries FOR ALL TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
