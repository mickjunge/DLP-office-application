import { supabase } from "@/integrations/supabase/client";

// One shared live connection for the whole app. Anything that shows
// bookings subscribes here and refetches when told something changed:
//   - a "booking_changed" broadcast on the "bookings-live" channel (sent by
//     the database trigger on every insert/update/delete, and also by the
//     browser that made the change as a backup),
//   - the tab becoming visible again / the browser coming back online /
//     the live connection re-establishing (catches up after sleep or a
//     dropped connection, when broadcasts were missed),
//   - a 60s heartbeat while the tab is visible (last-resort safety net).
const TOPIC = "bookings-live";
const EVENT = "booking_changed";
const HEARTBEAT_MS = 60_000;

const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let subscribed = false;
let heartbeat: number | undefined;

function notify() {
  listeners.forEach(fn => fn());
}

function onVisible() {
  if (document.visibilityState === "visible") notify();
}

function start() {
  let wasSubscribed = false;
  channel = supabase.channel(TOPIC);
  channel.on("broadcast", { event: EVENT }, notify).subscribe(status => {
    subscribed = status === "SUBSCRIBED";
    // Not on the very first connect (callers already fetched) — only when
    // the connection comes back after dropping.
    if (subscribed && wasSubscribed) notify();
    if (subscribed) wasSubscribed = true;
  });
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", notify);
  heartbeat = window.setInterval(onVisible, HEARTBEAT_MS);
}

function stop() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
  subscribed = false;
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("online", notify);
  window.clearInterval(heartbeat);
}

export function subscribeLiveBookings(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) stop();
  };
}

// Backup signal from the browser that made a change (the database trigger
// sends the same event; an extra refetch is harmless).
export function announceBookingsChanged(roomId: string) {
  const payload = { room_id: roomId };
  if (channel && subscribed) {
    void channel.send({ type: "broadcast", event: EVENT, payload });
    return;
  }
  const temp = supabase.channel(TOPIC);
  temp.subscribe(status => {
    if (status === "SUBSCRIBED") {
      void temp.send({ type: "broadcast", event: EVENT, payload });
      supabase.removeChannel(temp);
    }
  });
}
