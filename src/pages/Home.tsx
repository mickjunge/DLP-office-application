import FloorPlan from "@/components/FloorPlan";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] px-6 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-lg font-semibold text-gray-800">Office Hub</h1>
        <p className="text-sm text-gray-500 mt-0.5">Click a room to view or book it.</p>

        <div className="mt-6 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] p-5">
          <FloorPlan />
        </div>
      </div>
    </div>
  );
}
