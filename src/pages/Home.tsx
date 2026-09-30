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
        {room.capacity ?? "—"}
      </span>
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${room.has_tv ? "text-gray-500" : "text-gray-300"}`}>
        <Tv className="h-3.5 w-3.5" />
        {room.has_tv === null ? "—" : room.has_tv ? "TV" : "No TV"}
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
