<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Course/product catalog lives in src/lib/data.ts until Lovable Cloud tables replace it — single source for UI cards.
- Course management uses the un-nested admin_.content route under the authenticated layout so the approvals page cannot swallow its content; preserve the public /admin/content URL.
- Course covers store object paths on courses and use the private course-covers bucket with public signed reads and admin-only writes; share CourseCover between editors and public cards.
- Team photos store paths in team_photos and share the private course-covers bucket under team/ with CourseCover for signed display, keeping uploads admin-only.
- Course prices persist on courses; course-price validates whole-baht amounts and formats the shared student display so edits appear consistently.
- Registered member lists use a protected server function that verifies the caller's admin role before accessing Auth users; profile and wallet reads retain admin-scoped RLS.
