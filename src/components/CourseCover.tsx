import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COURSE_COVER_BUCKET } from "@/lib/course-cover";

export function CourseCover({ path, title }: { path?: string | null; title: string }) {
  const { data: url } = useQuery({
    queryKey: ["course-cover", path],
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from(COURSE_COVER_BUCKET).createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return url ? <img src={url} alt={`รูปปก ${title}`} className="absolute inset-0 h-full w-full object-cover" /> : null;
}