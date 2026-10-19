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
