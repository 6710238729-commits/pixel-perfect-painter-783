ALTER TABLE public.courses ADD COLUMN price integer NOT NULL DEFAULT 0 CHECK (price >= 0);
CREATE TABLE public.team_photos (id text PRIMARY KEY CHECK (id IN ('member-1','member-2','member-3')), photo_path text);
GRANT SELECT ON public.team_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_photos TO authenticated;
GRANT ALL ON public.team_photos TO service_role;
ALTER TABLE public.team_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team photos public read" ON public.team_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team photos admin write" ON public.team_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));