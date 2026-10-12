create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.wallets (
  user_id uuid primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "own wallet read" on public.wallets for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.topup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method text not null check (method in ('slip','angpao')),
  amount integer not null default 0 check (amount >= 0),
  slip_path text,
  voucher_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert on public.topup_requests to authenticated;
grant all on public.topup_requests to service_role;
alter table public.topup_requests enable row level security;
create policy "own topups read" on public.topup_requests for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own topups insert" on public.topup_requests for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.wallets (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.review_topup(_id uuid, _approve boolean, _amount integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.topup_requests;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into r from public.topup_requests where id = _id for update;
  if r.id is null or r.status <> 'pending' then raise exception 'Request not pending'; end if;
  if _approve then
    update public.topup_requests set status='approved', amount=coalesce(_amount, r.amount), reviewed_at=now() where id=_id;
    update public.wallets set balance = balance + coalesce(_amount, r.amount), updated_at=now() where user_id = r.user_id;
  else
    update public.topup_requests set status='rejected', reviewed_at=now() where id=_id;
  end if;
end $$;
revoke execute on function public.review_topup(uuid, boolean, integer) from anon, public;
grant execute on function public.review_topup(uuid, boolean, integer) to authenticated;

create policy "upload own slip" on storage.objects for insert to authenticated with check (bucket_id='slips' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own slip" on storage.objects for select to authenticated using (bucket_id='slips' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));