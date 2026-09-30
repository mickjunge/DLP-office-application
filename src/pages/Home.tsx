import FloorPlan from "@/components/FloorPlan";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative animate-in fade-in duration-500">
      <FloorPlan />

      <h1 className="absolute top-10 left-10 md:top-14 md:left-16 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
        Reserve a room
      </h1>
    </div>
  );
}
