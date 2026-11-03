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
  instant,
  onSave,
}: {
  booking: Booking;
  roomName?: string;
  bookings: Booking[];
  onClose: () => void;
  // Skip the entrance animation: set when this popup replaces another one
  // (the booking details popup), so there is no blank moment in between.
  instant?: boolean;
  onSave: (input: { company: string; bookedBy: string; startsAt: string; endsAt: string }) => Promise<void>;
}) {
  return createPortal(
    <div className={`fixed inset-0 z-80 flex items-start justify-center bg-black/70 backdrop-blur-sm ${instant ? "" : "animate-in fade-in duration-200"}`} onClick={onClose}>
      <div className={`mt-7 w-full max-w-md mx-4 ${instant ? "" : "animate-in fade-in slide-in-from-top-4 duration-300"}`} onClick={e => e.stopPropagation()}>
        <div className="glass-card pointer-events-auto"><div className="glass-card-inner !p-0 overflow-hidden rounded-[1.1875rem]">
          <div className="flex justify-between items-center py-3 px-4">
            <div>
              <p className="eyebrow !text-white">Edit booking</p>
              {roomName && <p className="text-sm text-white/85 mt-1">{roomName}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 inline-flex justify-center items-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 shrink-0">
            <div className="border-b border-white/15" />
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
        </div></div>
      </div>
    </div>,
    document.body
  );
}
