# FRAMELESS. Roadmap

- [x] Add and verify admin course-cover replacement on public course cards (upload, reload, removal).

- [x] Fix course-management navigation and add a regression test preserving the authenticated layout.
- [ ] Verify the course-management button with an authenticated admin account (blocked: no available admin session; user must sign in through the preview).

- [x] Phase 1: Design system + Home, Courses, Lesson player, Marketplace, 3D Profile cards
- [x] Lovable Cloud: auth (email/password, Google, reset), profiles, roles (user/admin)
- [x] Team page (3 members — waiting on real names/bios from user)
- [x] Wallet + top-up: bank slip (admin approval) and TrueMoney angpao (auto-redeem needs TRUEMONEY_PHONE)
- [ ] Real bank account details (waiting on user)
- [ ] DB: courses, lessons, lesson_progress, bookmarks, products, purchases, entitlements
- [ ] My Learning dashboard (continue watching, progress)
- [ ] Server-side purchase with idempotency; signed video URLs for premium
- [x] Admin dashboard: content CRUD (/admin/content) + topup approvals (/admin); admin account admin6767@frameless.app created
