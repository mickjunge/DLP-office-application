-- Live updates for everyone. Until now the browser that made a change sent
-- the "changed" signal itself, so nobody heard about it if that browser
-- closed first, and changes made any other way sent nothing. The database
-- now publishes the signal after every insert/update/delete on bookings.
--
-- Public broadcast channel "bookings-live" (no table access is exposed;
-- the payload is only the room id). Clients just refetch on any event.

create function notify_bookings_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'room_id',
      case when tg_op = 'DELETE' then old.room_id else new.room_id end
    ),
    'booking_changed',
    'bookings-live',
    false
  );
  return null;
end;
$$;

create trigger bookings_changed
  after insert or update or delete on bookings
  for each row execute function notify_bookings_changed();
