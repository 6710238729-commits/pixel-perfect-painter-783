CREATE TABLE public.courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'After Effects Beginner',
  level text NOT NULL DEFAULT 'Beginner',
  duration text NOT NULL DEFAULT '',
  premium boolean NOT NULL DEFAULT false,
  hue integer NOT NULL DEFAULT 255,
  description text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '',
  video_url text,
  free boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_course_idx ON public.lessons(course_id, position);
GRANT SELECT ON public.courses, public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses, public.lessons TO authenticated;
GRANT ALL ON public.courses, public.lessons TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "lessons public read" ON public.lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lessons admin write" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "videos public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'videos');
CREATE POLICY "videos admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "videos admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND public.has_role(auth.uid(),'admin'));