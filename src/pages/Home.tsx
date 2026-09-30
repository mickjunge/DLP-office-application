import FloorPlan from "@/components/FloorPlan";

const ROOMS = [
  { num: "01", name: "Small conference room" },
  { num: "02", name: "Big conference room" },
  { num: "03", name: "Studio" },
];

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative animate-in fade-in duration-1000">
      <FloorPlan />

      {/* Softens the hard edge between the floorplan and the title/nav
          sitting over it on the left — plain white fading to transparent,
          not a visible panel. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-white via-white/80 to-transparent" />

      <h1 className="absolute top-10 left-10 md:top-14 md:left-16 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
        Reserve a room
      </h1>

      <nav className="absolute top-28 left-10 md:top-36 md:left-16 flex flex-col gap-4">
        {ROOMS.map(room => (
          <div key={room.num} className="flex items-baseline gap-3">
            <span className="text-sm font-semibold text-gray-400">{room.num}</span>
            <span className="text-lg font-medium text-gray-900">{room.name}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
