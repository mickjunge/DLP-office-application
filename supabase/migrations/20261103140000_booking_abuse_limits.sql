-- Bot / abuse protection. The page has no login, so the limits live in the
-- database where they can't be bypassed by calling the API directly.

-- Who made the booking (first address in X-Forwarded-For, set by PostgREST's
-- proxy). Only used for rate limiting; not in bookings_public.
alter table bookings add column created_ip text;
create index bookings_created_ip_idx on bookings (created_ip, created_at);

-- Static sanity limits, enforced on every write path.
alter table bookings
  add constraint bookings_booked_by_length check (char_length(btrim(booked_by)) between 1 and 60),
  add constraint bookings_max_duration check (ends_at - starts_at <= interval '4 hours');

create or replace function check_booking_window(p_starts_at timestamptz, p_ends_at timestamptz)
returns void
language plpgsql
as $$
begin
  if p_ends_at - p_starts_at < interval '15 minutes' then
    raise exception 'A booking must be at least 15 minutes long';
  end if;
  if p_ends_at - p_starts_at > interval '4 hours' then
    raise exception 'A booking can be at most 4 hours long';
  end if;
  if p_starts_at > now() + interval '60 days' then
    raise exception 'Bookings can be made at most 60 days ahead';
  end if;
  if p_ends_at < now() then
    raise exception 'That time is already in the past';
  end if;
end;
$$;

create or replace function create_booking(
  p_room_id uuid,
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
  v_name text := btrim(coalesce(p_booked_by, ''));
  v_ip text := nullif(btrim(split_part(
    coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), '');
begin
  if p_company is null then
    raise exception 'A company is required';
  end if;
  if char_length(v_name) not between 1 and 60 then
    raise exception 'Please enter your name (at most 60 characters)';
  end if;
  perform check_booking_window(p_starts_at, p_ends_at);

  -- Serialise per source so two simultaneous requests can't both slip under a limit.
  perform pg_advisory_xact_lock(hashtext(coalesce(v_ip, lower(v_name))));

  if v_ip is not null and (
    select count(*) from bookings where created_ip = v_ip and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Too many bookings from your connection — please try again later';
  end if;
  if (
    select count(*) from bookings where lower(btrim(booked_by)) = lower(v_name) and ends_at > now()
  ) >= 10 then
    raise exception 'You already have 10 upcoming bookings — cancel one before adding more';
  end if;

  insert into bookings (room_id, starts_at, ends_at, booked_by, company, created_ip)
  values (p_room_id, p_starts_at, p_ends_at, v_name, p_company, v_ip)
  returning * into v_booking;
  return v_booking;
end;
$$;

create or replace function update_booking(
  p_booking_id uuid,
  p_edit_token uuid,
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
  if p_company is null then
    raise exception 'A company is required';
  end if;
  perform check_booking_window(p_starts_at, p_ends_at);
  update bookings
  set starts_at = p_starts_at, ends_at = p_ends_at, company = p_company
  where id = p_booking_id and edit_token = p_edit_token
  returning * into v_booking;

  if v_booking is null then
    raise exception 'Booking not found or edit token does not match';
  end if;

  return v_booking;
end;
$$;
