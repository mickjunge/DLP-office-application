import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRoomBookings, useMyBookingIds, type Booking } from "@/hooks/useBookings";
import RoomTimeline, { currentStatus } from "@/components/RoomTimeline";
import BookingForm, { defaultFormValues } from "@/components/BookingForm";
import EditBookingModal from "@/components/EditBookingModal";
import CancelBookingModal from "@/components/CancelBookingModal";

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
export default function RoomDetailPanel({ room, onBack }: { room: Room; onBack: () => void }) {
  const createFormRef = useRef<HTMLDivElement>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [slotPrefill, setSlotPrefill] = useState<Date | undefined>(undefined);

  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, cancelBooking } = useRoomBookings(room.id);
  const myBookingIds = useMyBookingIds();
  const status = currentStatus(bookings);

  const handleSlotClick = (date: Date) => {
    setSlotPrefill(date);
    setCreateFormKey(k => k + 1);
    createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Time filled in below", { duration: 1500 });
  };

  const handleCancelConfirmed = async (booking: Booking) => {
    await cancelBooking(booking.id);
    toast.success("Booking cancelled");
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-gray-800">{room.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {room.capacity ? `${room.capacity} seats · ` : ""}{room.location === "studio" ? "Studio" : "Office"}
            </p>
          </div>
          <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md ${status.busy ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div ref={createFormRef} className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
        <p className="text-base font-semibold text-gray-800 mb-3">Book this room</p>
        <BookingForm
          key={createFormKey}
          initial={defaultFormValues(slotPrefill)}
          bookings={bookings}
          onSubmit={async input => {
            await createBooking(input);
            toast.success("Booked");
            setSlotPrefill(undefined);
            setCreateFormKey(k => k + 1);
          }}
        />
      </div>

      <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
        {bookingsLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <RoomTimeline
            bookings={bookings}
            myBookingIds={myBookingIds}
            onEdit={setEditingBooking}
            onCancel={setCancellingBooking}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          roomName={room.name}
          bookings={bookings}
          onClose={() => setEditingBooking(null)}
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
          onClose={() => setCancellingBooking(null)}
          onConfirm={() => handleCancelConfirmed(cancellingBooking)}
        />
      )}
    </div>
  );
}
