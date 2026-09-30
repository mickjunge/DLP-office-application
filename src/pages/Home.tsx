import FloorPlan from "@/components/FloorPlan";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative">
      <h1 className="absolute top-10 right-10 md:top-14 md:right-16 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight text-right">
        Book a room
      </h1>

      <div className="h-full w-full flex items-center justify-end pr-10 md:pr-20">
        <div className="h-[90vh] animate-in fade-in zoom-in-90 duration-700 ease-out">
          <FloorPlan />
        </div>
      </div>
    </div>
  );
}
