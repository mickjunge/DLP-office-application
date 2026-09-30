import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FloorPlan, { type RoomSlug } from "@/components/FloorPlan";
import RoomDetailPanel, { type Room } from "@/components/RoomDetailPanel";

const ROOM_NUMBERS: Record<string, string> = {
  "small-conference-room": "01",
  "big-conference-room": "02",
  studio: "03",
};
const ROOM_ORDER = ["small-conference-room", "big-conference-room", "studio"];

function RoomBadges({ room }: { room: Room }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${room.capacity ? "text-gray-500" : "text-gray-300"}`}>
        <Users className="h-3.5 w-3.5" />
        {room.capacity ? `${room.capacity} seats` : "Seats N/A"}
      </span>
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${room.has_tv ? "text-gray-500" : "text-gray-300"}`}>
        <Tv className="h-3.5 w-3.5" />
        {room.has_tv === null ? "—" : room.has_tv ? "Screen" : "No screen"}
      </span>
    </div>
  );
}

export default function Home() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) throw error;
      return (data as Room[]).sort((a, b) => ROOM_ORDER.indexOf(a.slug) - ROOM_ORDER.indexOf(b.slug));
    },
  });

  const [selectedSlug, setSelectedSlug] = useState<RoomSlug | null>(null);
  const selectedRoom = rooms?.find(r => r.slug === selectedSlug) ?? null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative animate-in fade-in duration-1000">
      <FloorPlan
        zoomTo={selectedSlug ?? "overview"}
        onSelectRoom={slug => setSelectedSlug(slug)}
      />

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
        className={`pointer-events-none absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-white from-70% to-transparent to-100% transition-opacity duration-[900ms] ease-out ${selectedRoom ? "opacity-100" : "opacity-0"}`}
      />

      <div className="absolute top-10 left-10 md:top-14 md:left-16 bottom-10 w-full max-w-sm overflow-y-auto">
        {selectedRoom ? (
          <RoomDetailPanel room={selectedRoom} onBack={() => setSelectedSlug(null)} />
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Reserve a room</h1>

            <nav className="mt-8 flex flex-col gap-4">
              {rooms?.map(room => (
                <button
                  key={room.slug}
                  type="button"
                  onClick={() => setSelectedSlug(room.slug as RoomSlug)}
                  className="text-left cursor-pointer group"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-gray-400">{ROOM_NUMBERS[room.slug]}</span>
                    <span className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{room.name}</span>
                  </div>
                  <div className="pl-8">
                    <RoomBadges room={room} />
                  </div>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
