import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HIDDEN_ROOM_SLUGS } from "@/lib/rooms";
import RoomDetailPanel, { type Room } from "@/components/RoomDetailPanel";

export default function RoomDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", slug],
    queryFn: async () => {
      if (slug && HIDDEN_ROOM_SLUGS.has(slug)) throw new Error("Room not available");
      const { data, error } = await supabase.from("rooms").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data as Room;
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-dvh px-4 md:px-6 py-6">
      <div className="max-w-[56rem] mx-auto">
        {isLoading ? (
          <p className="text-sm text-white/85">Loading…</p>
        ) : !room ? (
          <p className="text-sm text-white/85">Room not found.</p>
        ) : (
          <RoomDetailPanel room={room} onBack={() => navigate("/")} />
        )}
      </div>
    </div>
  );
}
