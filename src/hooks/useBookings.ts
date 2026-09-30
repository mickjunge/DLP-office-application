import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useRoomBookings(roomId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bookings_public")
      .select("*")
      .eq("room_id", roomId)
      .order("starts_at", { ascending: true });
    if (!error) setBookings((data ?? []) as Booking[]);
    setIsLoading(false);
  }, [roomId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      return booking;
    },
    [roomId, refresh]
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
    },
    [refresh]
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
    },
    [refresh]
  );

  return { bookings, isLoading, createBooking, updateBooking, cancelBooking, refresh };
}
