import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Booking = {
  id: string;
  room_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  booked_by: string;
  created_at: string;
};

type MyBooking = { id: string; editToken: string };

const STORAGE_KEY = "office-hub:my-bookings";

function readMyBookings(): MyBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const LOCAL_CHANGE_EVENT = "office-hub:my-bookings-changed";

function writeMyBookings(bookings: MyBooking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  // The native "storage" event only fires in *other* tabs, not this
  // one — without this, the tab that just booked/cancelled wouldn't
  // see its own Edit/Cancel buttons appear/disappear until a reload.
  window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
}

// A booking is "mine" purely by possession of its edit_token in this
// browser's localStorage — there's no login, so ownership can't be
// checked any other way. Edit/cancel still validate the token
// server-side (see the 20260930150000 migration); this is just what
// decides whether the UI offers those actions at all.
export function useMyBookingIds() {
  const [ids, setIds] = useState<Set<string>>(() => new Set(readMyBookings().map(b => b.id)));

  useEffect(() => {
    const sync = () => setIds(new Set(readMyBookings().map(b => b.id)));
    window.addEventListener("storage", sync);
    window.addEventListener(LOCAL_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LOCAL_CHANGE_EVENT, sync);
    };
  }, []);

  return ids;
}

export function getEditToken(bookingId: string): string | undefined {
  return readMyBookings().find(b => b.id === bookingId)?.editToken;
}

function rememberBooking(id: string, editToken: string) {
  writeMyBookings([...readMyBookings().filter(b => b.id !== id), { id, editToken }]);
}

function forgetBooking(id: string) {
  writeMyBookings(readMyBookings().filter(b => b.id !== id));
}

const MAX_TIMEOUT = 2_000_000_000; // setTimeout's delay is a 32-bit int; clamp well under that

export function useRoomBookings(roomId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const boundaryTimeoutRef = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
    if (!roomId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bookings_public")
      .select("*")
      .eq("room_id", roomId)
      .order("starts_at", { ascending: true });
    if (!error) {
      const rows = (data ?? []) as Booking[];
      setBookings(rows);
      // currentStatus() (Free now / Busy until X) is derived from
      // bookings + the current time on every render — without this, it
      // would only ever re-evaluate when something else happened to
      // trigger a refetch (another booking change), and could sit
      // stale well past a booking's start/end time otherwise. Schedule
      // a refresh for exactly the next boundary so it flips live.
      const nowMs = Date.now();
      const nextBoundary = rows
        .flatMap(b => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()])
        .filter(t => t > nowMs)
        .sort((a, b) => a - b)[0];
      if (nextBoundary !== undefined) {
        const delay = Math.min(nextBoundary - nowMs + 250, MAX_TIMEOUT);
        boundaryTimeoutRef.current = window.setTimeout(refresh, delay);
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    refresh();
    return () => {
      if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current);
    };
  }, [refresh]);

  // Double-booking is already prevented regardless of this — the
  // bookings_no_overlap exclusion constraint rejects an overlapping
  // insert/update atomically at the database level no matter what any
  // client's UI currently shows. This is purely about freshness: without
  // it, someone viewing this room wouldn't see another person's booking
  // until they happened to refetch, and could waste an attempt booking
  // a slot that's actually already taken. No DB trigger needed — every
  // write already goes through this hook, so it broadcasts right after
  // a successful create/update/cancel; any other tab subscribed to this
  // same room's channel just refetches on that signal rather than
  // trying to patch state from the payload (simpler, and fine at the
  // scale of a few bookings per room).
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`room:${roomId}`);
    channel.on("broadcast", { event: "booking_changed" }, () => refresh());
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, refresh]);

  const notifyChanged = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "booking_changed", payload: {} });
  }, []);

  const createBooking = useCallback(
    async (input: { title: string; startsAt: string; endsAt: string; bookedBy: string }) => {
      if (!roomId) throw new Error("No room selected");
      const { data, error } = await supabase.rpc("create_booking", {
        p_room_id: roomId,
        p_title: input.title,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
        p_booked_by: input.bookedBy,
      });
      if (error) throw error;
      const booking = data as Booking & { edit_token: string };
      rememberBooking(booking.id, booking.edit_token);
      await refresh();
      notifyChanged();
      return booking;
    },
    [roomId, refresh, notifyChanged]
  );

  const updateBooking = useCallback(
    async (bookingId: string, input: { title: string; startsAt: string; endsAt: string }) => {
      const editToken = getEditToken(bookingId);
      if (!editToken) throw new Error("This booking wasn't made from this device — no edit link is stored here.");
      const { error } = await supabase.rpc("update_booking", {
        p_booking_id: bookingId,
        p_edit_token: editToken,
        p_title: input.title,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
      });
      if (error) throw error;
      await refresh();
      notifyChanged();
    },
    [refresh, notifyChanged]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      const editToken = getEditToken(bookingId);
      if (!editToken) throw new Error("This booking wasn't made from this device — no edit link is stored here.");
      const { error } = await supabase.rpc("cancel_booking", {
        p_booking_id: bookingId,
        p_edit_token: editToken,
      });
      if (error) throw error;
      forgetBooking(bookingId);
      await refresh();
      notifyChanged();
    },
    [refresh, notifyChanged]
  );

  return { bookings, isLoading, createBooking, updateBooking, cancelBooking, refresh };
}
