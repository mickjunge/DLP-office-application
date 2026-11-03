-- Booking titles are confidential per company, so bookings no longer have one:
-- the company is the title. This step is additive so the currently deployed
-- app keeps working until the new one is live; a follow-up migration drops
-- the old title-taking functions, the title column and the OTHER code.

alter table bookings alter column title drop not null;
update bookings set title = null;

-- The "OTHER" company is renamed EM. The constraint briefly allows both codes
-- so the deployed app (which still sends OTHER) keeps working.
alter table bookings drop constraint bookings_company_check;
alter table bookings add constraint bookings_company_check
  check (company in ('DLP', 'BTB', 'PIXEL', 'OTHER', 'EM'));
update bookings set company = 'EM' where company = 'OTHER';

-- Public view without title (new column list, so drop and recreate).
drop view bookings_public;
create view bookings_public as
  select id, room_id, starts_at, ends_at, booked_by, created_at, company
  from bookings;
grant select on bookings_public to anon, authenticated;

create function create_booking(
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
begin
  if p_company is null then
    raise exception 'A company is required';
  end if;
  insert into bookings (room_id, starts_at, ends_at, booked_by, company)
  values (p_room_id, p_starts_at, p_ends_at, p_booked_by, p_company)
  returning * into v_booking;
  return v_booking;
end;
$$;

grant execute on function create_booking(uuid, timestamptz, timestamptz, text, text) to anon, authenticated;

create function update_booking(
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

grant execute on function update_booking(uuid, uuid, timestamptz, timestamptz, text) to anon, authenticated;
