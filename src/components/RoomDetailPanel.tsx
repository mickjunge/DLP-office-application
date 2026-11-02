import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import GlassButton from "@/components/GlassButton";
import { toast } from "sonner";
import { useRoomBookings, useMyBookingIds, type Booking } from "@/hooks/useBookings";
import RoomTimeline, { currentStatus } from "@/components/RoomTimeline";
import BookingForm, { defaultFormValues } from "@/components/BookingForm";
import EditBookingModal from "@/components/EditBookingModal";
import CancelBookingModal from "@/components/CancelBookingModal";
import BookingDetailModal from "@/components/BookingDetailModal";

export type Room = {
  id: string;
  name: string;
  slug: string;
  location: "office" | "studio";
  capacity: number | null;
  has_tv: boolean | null;
};

// Shared between the standalone /rooms/:slug page and the inline
// master/detail view on the home page — same booking form + timeline,
// just embedded in a different surrounding layout by each caller.
export default function RoomDetailPanel({
  room,
  onBack,
  initialBooking,
}: {
  room: Room;
  onBack: () => void;
  // Open with this booking's details popup already showing (used when
  // arriving from "My bookings").
  initialBooking?: Booking;
}) {
  const createFormRef = useRef<HTMLDivElement>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  // true while edit/cancel was opened from the details popup (see "instant")
  const [handoff, setHandoff] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(initialBooking ?? null);
  // New object per click so clicking the same slot twice still re-applies it.
  const [slotPrefill, setSlotPrefill] = useState<{ date: Date } | undefined>(undefined);

  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, cancelBooking } = useRoomBookings(room.id);
  const myBookingIds = useMyBookingIds();
  // "Free until 14:00" / "Busy until…" is derived from the clock, so
  // re-render once a minute to keep it correct without any data change.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const status = currentStatus(bookings);

  const handleSlotClick = (date: Date) => {
    // Only the date/time get filled in — the form is not remounted, so
    // company and name the user already entered stay put.
    setSlotPrefill({ date });
    createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Time copied to start and end time", { duration: 1800 });
  };

  const handleCancelConfirmed = async (booking: Booking) => {
    await cancelBooking(booking.id);
    toast.success("Booking cancelled");
  };

  return (
    <div>
      {/* Back sits above both columns so the room card and the agenda start at the same height. */}
      <GlassButton onClick={onBack} className="glass-btn-outer--lg">
        <ArrowLeft className="h-5 w-5" />
        Back
      </GlassButton>

    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,25rem)] items-stretch">
      <div className="flex flex-col">
      <div className="glass-card"><div className="glass-card-inner">
        <p className="text-2xl font-bold tracking-tight text-white">{room.name}</p>
        <p className="text-[15px] text-white/90 mt-1">
          {room.capacity ? `${room.capacity} seats · ` : ""}{room.location === "studio" ? "Studio" : "Office"}
        </p>
        <span className={`mt-3 inline-block whitespace-nowrap transition-opacity duration-300 ${bookingsLoading ? "opacity-0" : "opacity-100"} text-xs font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full border ${status.busy ? "bg-red-500/25 text-red-100 border-red-300/50" : "bg-emerald-500/25 text-emerald-100 border-emerald-300/50"}`}>
          {status.label}
        </span>
      </div></div>

      <div ref={createFormRef} className="mt-4 glass-card flex-1"><div className="glass-card-inner h-full flex flex-col">
        <p className="text-2xl font-bold text-white tracking-tight mb-5">Book this room</p>
        <BookingForm
          key={createFormKey}
          roomName={room.name}
          initial={defaultFormValues()}
          slotPrefill={slotPrefill}
          bookings={bookings}
          onSubmit={async input => {
            await createBooking(input);
          }}
          // Runs once the confirmation popup's check animation has finished.
          onBooked={() => {
            setSlotPrefill(undefined);
            setCreateFormKey(k => k + 1);
          }}
        />
      </div></div>
      </div>

      <div className="glass-card"><div className="glass-card-inner h-full flex flex-col">
        <p className="text-2xl font-bold text-white tracking-tight mb-4">Agenda</p>
        {/* Always render the full-size timeline (empty until the bookings
            arrive) so the card doesn't grow once the data loads. */}
        <RoomTimeline
          bookings={bookingsLoading ? [] : bookings}
          myBookingIds={myBookingIds}
          onSlotClick={handleSlotClick}
          onSelect={setViewingBooking}
        />
      </div></div>
    </div>

      {viewingBooking && (
        <BookingDetailModal
          booking={viewingBooking}
          roomName={room.name}
          mine={myBookingIds.has(viewingBooking.id)}
          onClose={() => setViewingBooking(null)}
          onEdit={() => { setHandoff(true); setEditingBooking(viewingBooking); setViewingBooking(null); }}
          onCancel={() => { setHandoff(true); setCancellingBooking(viewingBooking); setViewingBooking(null); }}
        />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          roomName={room.name}
          bookings={bookings}
          instant={handoff}
          onClose={() => { setEditingBooking(null); setHandoff(false); }}
          onSave={async input => {
            await updateBooking(editingBooking.id, input);
            toast.success("Booking updated");
          }}
        />
      )}

      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          roomName={room.name}
          instant={handoff}
          onClose={() => { setCancellingBooking(null); setHandoff(false); }}
          onConfirm={() => handleCancelConfirmed(cancellingBooking)}
        />
      )}
    </div>
  );
}
