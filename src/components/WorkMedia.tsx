import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function WorkMedia({ path, type, title }: { path: string; type: string; title: string }) {
  const { data: url, isLoading, error } = useQuery({
    queryKey: ["work-media", path], staleTime: 240000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("learning-works").createSignedUrl(path, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return <div className="aspect-video overflow-hidden rounded-md bg-secondary">
    {url ? type === "video" ? <video src={url} controls preload="metadata" className="h-full w-full object-contain" aria-label={title} /> : <img src={url} alt={title} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{isLoading ? "กำลังโหลด…" : error ? "โหลดไฟล์ไม่สำเร็จ" : "ไม่มีไฟล์"}</div>}
  </div>;
}