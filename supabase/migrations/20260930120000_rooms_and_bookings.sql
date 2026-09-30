-- Needed for the EXCLUDE constraint below: GiST index support for
-- equality (room_id) combined with range overlap (tstzrange).
create extension if not exists btree_gist;

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null check (location in ('office', 'studio')),
  capacity int,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at),
  -- Rejects overlapping bookings for the same room atomically at the
  -- database level, so two concurrent requests can't both succeed and
  -- double-book a room (a JS-side "check then insert" would race).
  constraint bookings_no_overlap exclude using gist (
    room_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
);

alter table rooms enable row level security;
alter table bookings enable row level security;

-- Any signed-in user can see rooms and the full booking calendar.
create policy "rooms are viewable by authenticated users"
  on rooms for select
  to authenticated
  using (true);

create policy "bookings are viewable by authenticated users"
  on bookings for select
  to authenticated
  using (true);

-- Users can only create/modify/cancel their own bookings.
create policy "users can create their own bookings"
  on bookings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update their own bookings"
  on bookings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can delete their own bookings"
  on bookings for delete
  to authenticated
  using (user_id = auth.uid());
