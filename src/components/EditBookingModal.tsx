import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Booking } from "@/hooks/useBookings";
import BookingForm, { bookingToFormValues } from "@/components/BookingForm";

// Portal to document.body since this can be triggered from deep inside
// RoomTimeline (a scrollable card), which would otherwise clip it via
// overflow — same reasoning CLAUDE.md's modal convention calls for.
export default function EditBookingModal({
  booking,
  roomName,
  bookings,
  onClose,
  onSave,
}: {
  booking: Booking;
  roomName?: string;
  bookings: Booking[];
  onClose: () => void;
  onSave: (input: { title: string; bookedBy: string; startsAt: string; endsAt: string }) => Promise<void>;
}) {
  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/40 animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-md mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col bg-white border border-transparent shadow-2xs rounded-xl pointer-events-auto overflow-hidden">
          <div className="flex justify-between items-center py-3 px-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Edit booking</p>
              {roomName && <p className="text-xs text-gray-500 mt-0.5">{roomName}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-7 inline-flex justify-center items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 shrink-0">
            <div className="border-b border-gray-200" />
          </div>
          <div className="p-4">
            <BookingForm
              editing
              initial={bookingToFormValues(booking)}
              bookings={bookings}
              excludeBookingId={booking.id}
              onCancel={onClose}
              onSubmit={async input => {
                await onSave(input);
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
