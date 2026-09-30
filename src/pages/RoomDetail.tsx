import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Room = {
  id: string;
  name: string;
  slug: string;
  location: "office" | "studio";
  capacity: number | null;
};

export default function RoomDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data as Room;
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to floorplan
        </Link>

        <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !room ? (
            <p className="text-sm text-gray-500">Room not found.</p>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-800">{room.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {room.capacity ? `${room.capacity} seats · ` : ""}{room.location === "studio" ? "Studio" : "Office"}
              </p>
              <p className="text-sm text-gray-500 mt-4">Booking calendar goes here.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
