import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RoomDetailPanel, { type Room } from "@/components/RoomDetailPanel";

export default function RoomDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !room ? (
          <p className="text-sm text-gray-500">Room not found.</p>
        ) : (
          <RoomDetailPanel room={room} onBack={() => navigate("/")} />
        )}
      </div>
    </div>
  );
}
