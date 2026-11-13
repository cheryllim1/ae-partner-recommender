GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_state, public.activities, public.outreach, public.friction_items TO authenticated;
CREATE POLICY "Signed-in team can manage deal state" ON public.deal_state FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in team can manage activities" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in team can manage outreach" ON public.outreach FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in team can manage friction" ON public.friction_items FOR ALL TO authenticated USING (true) WITH CHECK (true);