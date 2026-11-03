import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Tv, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FloorPlan, { type RoomSlug } from "@/components/FloorPlan";
import RoomDetailPanel, { type Room } from "@/components/RoomDetailPanel";
import EditBookingModal from "@/components/EditBookingModal";
import CancelBookingModal from "@/components/CancelBookingModal";
import { HIDDEN_ROOM_SLUGS } from "@/lib/rooms";
import { useRoomsStatus } from "@/hooks/useRoomsStatus";
import { useMyReservations, type MyReservation } from "@/hooks/useMyReservations";
import { updateBookingRpc, cancelBookingRpc, type Booking } from "@/hooks/useBookings";

const ROOM_NUMBERS: Record<string, string> = {
  "small-conference-room": "01",
  "big-conference-room": "02",
  studio: "03",
};
const ROOM_ORDER = ["small-conference-room", "big-conference-room"];
const visibleRooms = (rooms: Room[]) => rooms.filter(r => !HIDDEN_ROOM_SLUGS.has(r.slug));

function reservationLabel(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const today = new Date();
  const dayLabel =
    start.toDateString() === today.toDateString()
      ? "Today"
      : start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return `${dayLabel} · ${timeLabel}`;
}

function Blurb() {
  return (
    <div className="text-sm leading-relaxed text-white/80 animate-in fade-in duration-700">
      <p>
        <span className="text-white font-medium">Book a meeting room here.</span> No login needed.
      </p>
      <p className="mt-1.5 text-white/70">
        Once you book, your booking appears here under My bookings. Change or cancel it there, or from your booking in a room's timeline, in the browser you booked from.
      </p>
      <p className="mt-1.5 text-white/70">
        Something not working?{" "}
        <a
          href="mailto:mick@davidlewis.nl?subject=meetingsrooms.davidlewis.nl%3A%20bug%20report"
          className="pointer-events-auto text-white underline underline-offset-2 hover:text-white/80 transition-colors"
        >
          Report a bug
        </a>
      </p>
    </div>
  );
}

function RoomBadges({ room }: { room: Room }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${room.capacity ? "text-white/85" : "text-white/55"}`}>
        <Users className="h-4 w-4" />
        {room.capacity ? `${room.capacity} seats` : "Seats N/A"}
      </span>
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${room.has_tv ? "text-white/85" : "text-white/55"}`}>
        <Tv className="h-4 w-4" />
        {room.has_tv === null ? "—" : room.has_tv ? "Screen" : "No screen"}
      </span>
    </div>
  );
}

// Rooms almost never change, so the last fetched list is kept in
// localStorage and used as initial data: repeat visits render the room
// list instantly while the query still refetches in the background.
const ROOMS_CACHE_KEY = "dlp-office-rooms";

function readCachedRooms(): Room[] | undefined {
  try {
    const raw = localStorage.getItem(ROOMS_CACHE_KEY);
    return raw ? visibleRooms(JSON.parse(raw) as Room[]) : undefined;
  } catch {
    return undefined;
  }
}

function RoomListSkeleton() {
  return (
    <>
      {ROOM_ORDER.map(slug => (
        <div key={slug} className="animate-pulse">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold text-white/40">{ROOM_NUMBERS[slug]}</span>
            <span className="h-5 w-44 rounded-full bg-white/10" />
          </div>
          <div className="pl-8 mt-2 flex gap-3">
            <span className="h-3.5 w-16 rounded-full bg-white/10" />
            <span className="h-3.5 w-16 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Home() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) throw error;
      const sorted = visibleRooms(data as Room[]).sort((a, b) => ROOM_ORDER.indexOf(a.slug) - ROOM_ORDER.indexOf(b.slug));
      try {
        localStorage.setItem(ROOMS_CACHE_KEY, JSON.stringify(sorted));
      } catch {
        // storage unavailable (private mode / quota) — cache is optional
      }
      return sorted;
    },
    initialData: readCachedRooms,
    initialDataUpdatedAt: 0,
  });

  const { reservations: allReservations, refresh: refreshMyReservations } = useMyReservations(rooms ?? []);
  const myReservations = allReservations.filter(r => r.roomName !== "Unknown room");

  const [editingReservation, setEditingReservation] = useState<MyReservation | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState<MyReservation | null>(null);
  // EditBookingModal needs the target room's other bookings for its
  // conflict check — fetched on demand when the modal opens rather
  // than kept loaded for every room all the time on the overview.
  const [editingRoomBookings, setEditingRoomBookings] = useState<Booking[]>([]);
  useEffect(() => {
    if (!editingReservation) return;
    let cancelled = false;
    supabase
      .from("bookings_public")
      .select("*")
      .eq("room_id", editingReservation.room_id)
      .then(({ data }) => {
        if (!cancelled) setEditingRoomBookings((data ?? []) as Booking[]);
      });
    return () => {
      cancelled = true;
    };
  }, [editingReservation]);

  const [selectedSlug, setSelectedSlug] = useState<RoomSlug | null>(null);
  // Set when a row in "My bookings" is clicked: the room opens with that
  // booking's details popup already showing. Cleared on any other navigation.
  const [focusBooking, setFocusBooking] = useState<Booking | null>(null);
  const openRoom = (slug: RoomSlug | null, booking: Booking | null = null) => {
    setFocusBooking(booking);
    setSelectedSlug(slug);
  };
  const selectedRoom = rooms?.find(r => r.slug === selectedSlug) ?? null;

  const busyRoomIds = useRoomsStatus(rooms?.map(r => r.id) ?? []);
  const busySlugs = new Set((rooms ?? []).filter(r => busyRoomIds.has(r.id)).map(r => r.slug as RoomSlug));

  // Slide in/out on the panel content: React can't animate an exit on
  // its own (a conditional swap just unmounts instantly), so this
  // tracks the content that's actually on screen separately from
  // selectedSlug, and delays swapping it until the exit animation has
  // had time to play. "forward" = heading into (or between) rooms,
  // slides right-to-left; "back" = heading to the nav list, mirrors it.
  const currentKey = selectedSlug ?? "nav";
  const [displayedKey, setDisplayedKey] = useState<string>("nav");
  const [phase, setPhase] = useState<"idle" | "exiting">("idle");
  const direction = currentKey === "nav" ? "back" : "forward";

  useEffect(() => {
    if (currentKey === displayedKey) return;
    setPhase("exiting");
    const t = setTimeout(() => {
      setDisplayedKey(currentKey);
      setPhase("idle");
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const displayedRoom = rooms?.find(r => r.slug === displayedKey) ?? null;
  const panelAnimClass =
    phase === "exiting"
      ? `animate-out fade-out duration-200 ${direction === "forward" ? "slide-out-to-left-4" : "slide-out-to-right-4"}`
      : `animate-in fade-in duration-300 ${direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"}`;

  return (
    <div className="h-dvh w-screen overflow-hidden relative animate-in fade-in duration-1000">
      {/* Phones: the map is too small to tap reliably, so it only sits
          dimmed behind the room list (which is the way in on phones). */}
      <div className="absolute inset-0 max-md:opacity-[0.12] max-md:pointer-events-none">
        <FloorPlan
          zoomTo={selectedSlug ?? "overview"}
          onSelectRoom={slug => openRoom(slug)}
          busySlugs={busySlugs}
        />
      </div>

      {/* Only shown in detail view — the floorplan is zoomed in behind
          the panel here (unlike the overview, where it's zoomed out and
          mostly out of the way on the left already), so the panel needs
          a backdrop to stay legible over it. Wider than a literal "left
          third": at this zoom level, on a typical wide window, the
          floorplan's actual content doesn't start until roughly 40-45%
          across (xMaxYMid alignment + a tall crop leaves a blank margin
          before it) — a 33%-wide fade would sit entirely over that
          blank margin and do nothing, the same invisible-fade mistake
          from earlier in this project. Widened so it actually reaches
          the drawn content, confirmed by rendering the big-conference-
          room zoom at 1440px: content starts at ~43%.

          Stop positions matter as much as width here: a default
          from/via/to gradient starts fading almost immediately, so by
          the time it reached real content it was already mostly
          transparent. from-70%/to-100% keeps it fully solid until 70%
          of this div's own width (~42% of the screen, right where
          content begins) and only fades out after that.

          Always mounted (not conditionally rendered) so opacity can
          transition both ways — appearing when a room is selected,
          and fading back out over the same ~900ms as the floorplan's
          own zoom-out when going Back, instead of vanishing instantly
          the moment selectedRoom clears. pointer-events-none means it
          being present-but-invisible at opacity-0 has no effect. */}
      <div
        className={`max-md:hidden pointer-events-none absolute inset-y-0 left-0 w-[78%] bg-gradient-to-r from-[#000204]/80 from-70% to-transparent to-100% transition-opacity duration-[900ms] ease-out ${selectedRoom ? "opacity-100" : "opacity-0"}`}
      />

      <div className={`absolute inset-x-0 top-0 bottom-0 md:inset-x-auto md:top-14 md:left-16 md:bottom-10 w-full ${displayedRoom ? "max-w-[56rem]" : "max-w-xl"} px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] md:p-0 md:pr-6 overflow-y-auto`}>
        <div key={displayedKey + phase} className={panelAnimClass}>
          {displayedRoom ? (
            <RoomDetailPanel room={displayedRoom} initialBooking={focusBooking ?? undefined} onBack={() => openRoom(null)} />
          ) : (
            <>
              <img src="/logo-transparent.png" alt="DLP" className="h-12 md:h-14 w-auto object-contain mb-6 md:mb-8" />
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.02] whitespace-nowrap">Book a room</h1>

              <nav className="mt-8 flex flex-col gap-4">
                {!rooms && <RoomListSkeleton />}
                {rooms?.map(room => (
                  <button
                    key={room.slug}
                    type="button"
                    onClick={() => openRoom(room.slug as RoomSlug)}
                    className="text-left cursor-pointer group max-md:py-2"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-semibold text-white/70">{ROOM_NUMBERS[room.slug]}</span>
                      <span className="text-lg font-medium text-white group-hover:text-white/85 transition-colors">{room.name}</span>
                    </div>
                    <div className="pl-8">
                      <RoomBadges room={room} />
                    </div>
                  </button>
                ))}
              </nav>

              {myReservations.length > 0 && (
                <div className="mt-10">
                  <p className="text-2xl font-bold text-white tracking-tight mb-4">My bookings</p>
                  <div className="flex flex-col gap-4">
                    {myReservations.map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-2 group">
                        <button
                          type="button"
                          onClick={() => {
                            const slug = rooms?.find(room => room.id === r.room_id)?.slug as RoomSlug | undefined;
                            if (slug) openRoom(slug, r);
                          }}
                          className="text-left cursor-pointer min-w-0 flex-1"
                        >
                          <p className="text-lg font-medium text-white group-hover:text-white/60 transition-colors truncate">{r.title}</p>
                          <p className="text-sm font-medium text-white/85 mt-1">{r.roomName} · {reservationLabel(r.starts_at, r.ends_at)}</p>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingReservation(r)}
                            title="Edit booking"
                            className="size-10 max-md:size-11 inline-flex items-center justify-center rounded-full border border-transparent text-white/50 hover:border-white/30 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingReservation(r)}
                            title="Cancel booking"
                            className="size-10 max-md:size-11 inline-flex items-center justify-center rounded-full border border-transparent text-white/50 hover:bg-red-500/25 hover:border-red-300/50 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:hidden mt-10">
                <Blurb />
              </div>
            </>
          )}
        </div>
      </div>

      {!selectedRoom && (
        <div className="max-md:hidden pointer-events-none absolute bottom-8 left-16 max-w-sm">
          <Blurb />
        </div>
      )}

      {editingReservation && (
        <EditBookingModal
          booking={editingReservation}
          roomName={editingReservation.roomName}
          bookings={editingRoomBookings}
          onClose={() => setEditingReservation(null)}
          onSave={async input => {
            await updateBookingRpc(editingReservation.id, input);
            toast.success("Booking updated");
            await refreshMyReservations();
          }}
        />
      )}

      {cancellingReservation && (
        <CancelBookingModal
          booking={cancellingReservation}
          roomName={cancellingReservation.roomName}
          onClose={() => setCancellingReservation(null)}
          onConfirm={async () => {
            await cancelBookingRpc(cancellingReservation.id, cancellingReservation.room_id);
            toast.success("Booking cancelled");
            await refreshMyReservations();
          }}
        />
      )}
    </div>
  );
}
