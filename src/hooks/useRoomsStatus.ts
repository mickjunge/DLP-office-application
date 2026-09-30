import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_TIMEOUT = 2_000_000_000; // setTimeout's delay is a 32-bit int; clamp well under that

// Which of the given rooms currently have an active booking (starts_at
// <= now < ends_at). Used for the overview's green/red coloring.
//
// Kept live three ways: the same per-room broadcast channels
// useRoomBookings uses (updates the moment someone books/cancels), a
// precise setTimeout scheduled for the next booking start/end time
// among what's currently loaded (so a room flips color right at 20:00,
// not up to 30s late), and a 5-minute poll as a defensive fallback in
// case scheduling is ever missed.
export function useRoomsStatus(roomIds: string[]) {
  const [busyRoomIds, setBusyRoomIds] = useState<Set<string>>(new Set());
  const key = roomIds.slice().sort().join(",");
  const boundaryTimeoutRef = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
    if (roomIds.length === 0) {
      setBusyRoomIds(new Set());
      return;
    }
    const now = new Date();
    // Widen past "active now" to a lookahead window so there's enough
    // data to know when the *next* transition happens, not just
    // whether one is happening right this instant.
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("bookings_public")
      .select("room_id, starts_at, ends_at")
      .in("room_id", roomIds)
      .lt("starts_at", windowEnd)
      .gt("ends_at", now.toISOString());
    if (error) return;

    const rows = data ?? [];
    const nowMs = Date.now();
    setBusyRoomIds(
      new Set(rows.filter(r => new Date(r.starts_at).getTime() <= nowMs).map(r => r.room_id as string))
    );

    const nextBoundary = rows
      .flatMap(r => [new Date(r.starts_at).getTime(), new Date(r.ends_at).getTime()])
      .filter(t => t > nowMs)
      .sort((a, b) => a - b)[0];
    if (nextBoundary !== undefined) {
      const delay = Math.min(nextBoundary - nowMs + 250, MAX_TIMEOUT);
      boundaryTimeoutRef.current = window.setTimeout(refresh, delay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    refresh();
    return () => {
      if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
    };
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
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return busyRoomIds;
}
