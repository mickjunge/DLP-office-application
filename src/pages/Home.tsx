import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FloorPlan from "@/components/FloorPlan";

type Room = {
  id: string;
  name: string;
  slug: string;
  location: "office" | "studio";
  capacity: number | null;
  has_tv: boolean | null;
};

const ROOM_NUMBERS: Record<string, string> = {
  "small-conference-room": "01",
  "big-conference-room": "02",
  studio: "03",
};
const ROOM_ORDER = ["small-conference-room", "big-conference-room", "studio"];

export default function Home() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) throw error;
      return (data as Room[]).sort((a, b) => ROOM_ORDER.indexOf(a.slug) - ROOM_ORDER.indexOf(b.slug));
    },
  });

  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative animate-in fade-in duration-1000">
      <FloorPlan />

      <h1 className="absolute top-10 left-10 md:top-14 md:left-16 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
        Reserve a room
      </h1>

      <nav className="absolute top-28 left-10 md:top-36 md:left-16 flex flex-col gap-1 w-64">
        {rooms?.map(room => {
          const expanded = expandedSlug === room.slug;
          return (
            <div key={room.slug}>
              <button
                type="button"
                onClick={() => setExpandedSlug(expanded ? null : room.slug)}
                className="w-full flex items-baseline gap-3 py-1.5 text-left cursor-pointer group"
              >
                <span className="text-sm font-semibold text-gray-400">{ROOM_NUMBERS[room.slug]}</span>
                <span className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{room.name}</span>
              </button>

              {/* Slide open/closed via a CSS grid-template-rows transition
                  (0fr -> 1fr) rather than a JS-measured max-height — no
                  layout thrash, and it naturally handles content of any
                  length. */}
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="pl-8 pb-3 flex flex-col gap-1">
                    <p className="text-sm text-gray-500">{room.capacity ? `${room.capacity} seats` : "Capacity N/A"}</p>
                    <p className="text-sm text-gray-500">{room.has_tv === null ? "TV: N/A" : room.has_tv ? "Has TV" : "No TV"}</p>
                    <Link to={`/rooms/${room.slug}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-1">
                      View & book →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
