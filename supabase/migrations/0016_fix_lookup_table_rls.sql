-- Phase 1's genders/recipient_tags/packaging_types tables ended up with RLS
-- enabled (likely via Supabase Studio's security-advisor prompt) but no
-- policies were ever added for them in 0015. RLS-enabled + zero policies
-- means every role — including the app's anon/authenticated client — gets
-- zero rows back, silently emptying every admin dropdown that reads these
-- tables (Target Gender, Recipient Tags, Packaging Type) despite the tables
-- having real data. Add the same public-read / admin-manage policy pattern
-- already used for the junction tables in 0015.

DROP POLICY IF EXISTS "Public can view genders" ON public.genders;
CREATE POLICY "Public can view genders"
    ON public.genders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage genders" ON public.genders;
CREATE POLICY "Admins can manage genders"
    ON public.genders FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Public can view recipient tags" ON public.recipient_tags;
CREATE POLICY "Public can view recipient tags"
    ON public.recipient_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage recipient tags" ON public.recipient_tags;
CREATE POLICY "Admins can manage recipient tags"
    ON public.recipient_tags FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "Public can view packaging types" ON public.packaging_types;
CREATE POLICY "Public can view packaging types"
    ON public.packaging_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage packaging types" ON public.packaging_types;
CREATE POLICY "Admins can manage packaging types"
    ON public.packaging_types FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );
