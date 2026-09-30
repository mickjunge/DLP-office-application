export default function Home() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg font-semibold text-gray-800">Office Hub</h1>

        <div className="mt-6 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
          <p className="text-base font-semibold text-gray-800">Meeting rooms & studio</p>
          <p className="text-sm text-gray-500 mt-0.5">Booking calendar goes here.</p>
        </div>
      </div>
    </div>
  );
}
