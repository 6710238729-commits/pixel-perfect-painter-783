ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cover_path text;
CREATE POLICY "Course covers readable by everyone" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'course-covers');
CREATE POLICY "Admins upload course covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete course covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-covers' AND public.has_role(auth.uid(), 'admin'));