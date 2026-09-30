import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Which of the given rooms currently have an active booking (starts_at
// <= now < ends_at). Used for the overview's green/red coloring — kept
// live via the same per-room broadcast channels useRoomBookings uses
// (so it updates the moment someone books/cancels), plus a 30s poll
// fallback since "now" moving past a booking's start/end time isn't an
// event anyone broadcasts.
export function useRoomsStatus(roomIds: string[]) {
  const [busyRoomIds, setBusyRoomIds] = useState<Set<string>>(new Set());
  const key = roomIds.slice().sort().join(",");

  const refresh = useCallback(async () => {
    if (roomIds.length === 0) {
      setBusyRoomIds(new Set());
      return;
    }
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("bookings_public")
      .select("room_id")
      .in("room_id", roomIds)
      .lte("starts_at", nowIso)
      .gt("ends_at", nowIso);
    if (!error) setBusyRoomIds(new Set((data ?? []).map(b => b.room_id as string)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (roomIds.length === 0) return;
    const channels = roomIds.map(id => {
      const channel = supabase.channel(`room:${id}`);
      channel.on("broadcast", { event: "booking_changed" }, () => refresh());
      channel.subscribe();
      return channel;
    });
    return () => channels.forEach(ch => supabase.removeChannel(ch));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return busyRoomIds;
}
