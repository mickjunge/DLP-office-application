-- No login for now: the app is a public page for the whole office.
-- Ownership is dropped in favor of a free-text "booked by" name, and
-- RLS is opened up to the anon role (Supabase's unauthenticated role)
-- rather than requiring auth.uid().

drop policy "users can create their own bookings" on bookings;
drop policy "users can update their own bookings" on bookings;
drop policy "users can delete their own bookings" on bookings;
drop policy "bookings are viewable by authenticated users" on bookings;
drop policy "rooms are viewable by authenticated users" on rooms;

alter table bookings drop constraint bookings_user_id_fkey;
alter table bookings drop column user_id;
alter table bookings add column booked_by text not null default '';
alter table bookings alter column booked_by drop default;

create policy "rooms are viewable by anyone"
  on rooms for select
  to anon, authenticated
  using (true);

create policy "bookings are viewable by anyone"
  on bookings for select
  to anon, authenticated
  using (true);

create policy "anyone can create bookings"
  on bookings for insert
  to anon, authenticated
  with check (true);

create policy "anyone can update bookings"
  on bookings for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "anyone can delete bookings"
  on bookings for delete
  to anon, authenticated
  using (true);
