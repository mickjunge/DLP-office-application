-- Public-write access to the bookings table (from the previous
-- migration) meant anyone could edit/cancel anyone else's booking, with
-- no way to tell them apart. Switching to a token-per-booking model:
-- creating a booking mints a secret edit_token, returned once at
-- creation and never selectable afterward. Editing/canceling requires
-- that token, checked server-side — the client can't just decide it
-- "owns" a booking, since RLS can't do that without real auth.

alter table bookings add column edit_token uuid not null default gen_random_uuid();

-- Direct table access is revoked below; everything goes through
-- bookings_public (read) or the three functions (write), so
-- edit_token is never exposed in a listing.
create view bookings_public as
  select id, room_id, title, starts_at, ends_at, booked_by, created_at
  from bookings;

grant select on bookings_public to anon, authenticated;

drop policy "bookings are viewable by anyone" on bookings;
drop policy "anyone can create bookings" on bookings;
drop policy "anyone can update bookings" on bookings;
drop policy "anyone can delete bookings" on bookings;

-- No replacement policies on the bookings table itself — anon has zero
-- direct access now. All three functions below are security definer,
-- so they run as the table owner and bypass RLS on purpose; that's the
-- only path to the base table (and its edit_token column) left open.

create function create_booking(
  p_room_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_booked_by text
) returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings;
begin
  insert into bookings (room_id, title, starts_at, ends_at, booked_by)
  values (p_room_id, p_title, p_starts_at, p_ends_at, p_booked_by)
  returning * into v_booking;
  return v_booking;
end;
$$;

grant execute on function create_booking(uuid, text, timestamptz, timestamptz, text) to anon, authenticated;

create function update_booking(
  p_booking_id uuid,
  p_edit_token uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings;
begin
  update bookings
  set title = p_title, starts_at = p_starts_at, ends_at = p_ends_at
  where id = p_booking_id and edit_token = p_edit_token
  returning * into v_booking;

  if v_booking is null then
    raise exception 'Booking not found or edit token does not match';
  end if;

  return v_booking;
end;
$$;

grant execute on function update_booking(uuid, uuid, text, timestamptz, timestamptz) to anon, authenticated;

create function cancel_booking(
  p_booking_id uuid,
  p_edit_token uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from bookings where id = p_booking_id and edit_token = p_edit_token;
  return found;
end;
$$;

grant execute on function cancel_booking(uuid, uuid) to anon, authenticated;
