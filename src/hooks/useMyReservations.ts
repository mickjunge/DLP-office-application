import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyBookingIds, type Booking } from "@/hooks/useBookings";

export type MyReservation = Booking & { roomName: string };

// Full details (title, times, room name) for whichever bookings this
// browser's localStorage recognizes as "mine" (see useMyBookingIds) —
// that only tracks ids/tokens, not the actual booking content, so this
// fetches bookings_public for those specific ids and joins in the room
// name from the already-loaded room list (no extra rooms query).
// Past reservations (ends_at already gone) are filtered out — this is
// "my upcoming reservations", not a history log.
export function useMyReservations(rooms: { id: string; name: string }[]) {
  const myIds = useMyBookingIds();
  const idsKey = Array.from(myIds).sort().join(",");
  const roomsKey = rooms.map(r => r.id).join(",");
  const [reservations, setReservations] = useState<MyReservation[]>([]);

  const refresh = useCallback(async () => {
    if (myIds.size === 0) {
      setReservations([]);
      return;
    }
    const { data, error } = await supabase
      .from("bookings_public")
      .select("*")
      .in("id", Array.from(myIds))
      .order("starts_at", { ascending: true });
    if (error) return;
    const roomNameById = new Map(rooms.map(r => [r.id, r.name]));
    const nowMs = Date.now();
    setReservations(
      (data as Booking[])
        .filter(b => new Date(b.ends_at).getTime() > nowMs)
        .map(b => ({ ...b, roomName: roomNameById.get(b.room_id) ?? "Unknown room" }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, roomsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Not scheduled to the exact second like room status (this is a
  // supplementary list, not the primary "is it free" signal) — a
  // reservation dropping off within a minute of ending is fine.
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return reservations;
}
