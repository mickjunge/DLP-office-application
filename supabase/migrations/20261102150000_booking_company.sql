-- Company on every booking (DLP / BTB / PIXEL / OTHER), separate from the
-- free-text title. Nullable so bookings made before this keep working (the
-- agenda falls back to their title); the check constraint stops anything
-- other than the four codes being stored, even through direct API calls.

alter table bookings
  add column company text
  check (company in ('DLP', 'BTB', 'PIXEL', 'OTHER'));

-- Same view as before plus company (new column goes last, so
-- "create or replace" keeps existing grants). edit_token still isn't exposed.
create or replace view bookings_public as
  select id, room_id, title, starts_at, ends_at, booked_by, created_at, company
  from bookings;

-- New overloads that take the company. The old 5- and 5-argument versions
-- are left in place so the currently deployed app keeps working until the
-- new one is live; drop them in a later migration.
create function create_booking(
  p_room_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_booked_by text,
  p_company text
) returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings;
begin
  insert into bookings (room_id, title, starts_at, ends_at, booked_by, company)
  values (p_room_id, p_title, p_starts_at, p_ends_at, p_booked_by, p_company)
  returning * into v_booking;
  return v_booking;
end;
$$;

grant execute on function create_booking(uuid, text, timestamptz, timestamptz, text, text) to anon, authenticated;

create function update_booking(
  p_booking_id uuid,
  p_edit_token uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_company text
) returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings;
begin
  update bookings
  set title = p_title, starts_at = p_starts_at, ends_at = p_ends_at, company = p_company
  where id = p_booking_id and edit_token = p_edit_token
  returning * into v_booking;

  if v_booking is null then
    raise exception 'Booking not found or edit token does not match';
  end if;

  return v_booking;
end;
$$;

grant execute on function update_booking(uuid, uuid, text, timestamptz, timestamptz, text) to anon, authenticated;
