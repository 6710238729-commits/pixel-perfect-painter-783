import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";
import { fetchAdminMembers } from "@/lib/admin-members.functions";
import { Button } from "@/components/ui/button";

export function AdminMembers() {
  const fetchMembers = useServerFn(fetchAdminMembers);
  const { data: members, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ["admin-members"], queryFn: () => fetchMembers() });
  const [search, setSearch] = useState("");
  const filtered = members?.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  return <section className="mt-12 border-t border-border pt-8 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users />สมาชิกที่สมัคร {members && <span className="text-sm text-muted-foreground">({members.length})</span>}</h2>
      <Button variant="outline" size="icon" title="อัปเดตรายชื่อและเครดิต" aria-label="อัปเดตรายชื่อและเครดิต" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? "animate-spin" : ""} /></Button>
    </div>
    <label className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="ค้นหาสมาชิก" placeholder="ค้นหาชื่อหรืออีเมล" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
    {isLoading ? <p className="mt-5 text-muted-foreground">กำลังโหลดสมาชิก…</p> : error ? <p role="alert" className="mt-5 text-destructive">โหลดรายชื่อไม่สำเร็จ กรุณาลองใหม่</p> : <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3 pr-4">ชื่อ</th><th className="py-3 pr-4">อีเมล</th><th className="py-3 pr-4">วันที่สมัคร</th><th className="py-3 text-right">เครดิตคงเหลือ</th></tr></thead>
        <tbody>{filtered.map((m) => <tr key={m.id} className="border-b border-border"><td className="py-4 pr-4">{m.name}</td><td className="py-4 pr-4">{m.email}</td><td className="whitespace-nowrap py-4 pr-4">{new Date(m.createdAt).toLocaleDateString("th-TH")}</td><td className="whitespace-nowrap py-4 text-right font-semibold text-cyan">{m.balance.toLocaleString("th-TH")} เครดิต</td></tr>)}</tbody>
      </table>{!filtered.length && <p className="py-6 text-center text-muted-foreground">ไม่พบสมาชิก</p>}
    </div>}
  </section>;
}