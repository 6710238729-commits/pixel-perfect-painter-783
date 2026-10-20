GRANT SELECT ON public.profiles TO authenticated;
CREATE POLICY "admin profiles read" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));