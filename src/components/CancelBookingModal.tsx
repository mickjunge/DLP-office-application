import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "@/hooks/useBookings";
import { friendlyError } from "@/lib/friendlyError";

export default function CancelBookingModal({
  booking,
  roomName,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  roomName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      toast.error(friendlyError(err));
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/40 animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-sm mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col bg-white border border-transparent shadow-2xs rounded-xl pointer-events-auto overflow-hidden">
          <div className="flex justify-between items-center py-3 px-4">
            <p className="text-sm font-semibold text-gray-800">Cancel booking</p>
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
            <p className="text-sm text-gray-600">
              Cancel <span className="font-medium text-gray-800">"{booking.title}"</span>
              {roomName ? ` in ${roomName}` : ""}? This can't be undone.
            </p>
          </div>
          <div className="flex justify-end items-center gap-2 py-3 px-4">
            <button
              type="button"
              onClick={onClose}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden transition-colors cursor-pointer"
            >
              Keep booking
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              style={{ background: "rgba(220,38,38,0.9)" }}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-transparent text-white shadow-sm focus:outline-hidden transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? "Cancelling…" : "Cancel booking"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
