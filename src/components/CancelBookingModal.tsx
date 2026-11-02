import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "@/hooks/useBookings";
import { friendlyError } from "@/lib/friendlyError";
import GlassButton from "@/components/GlassButton";

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
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-sm mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="glass-card pointer-events-auto"><div className="glass-card-inner !p-0 overflow-hidden rounded-[1.1875rem]">
          <div className="flex justify-between items-center py-3 px-4">
            <p className="eyebrow !text-white">Cancel booking</p>
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
            <p className="text-sm text-white/92">
              Cancel <span className="font-medium text-white">"{booking.title}"</span>
              {roomName ? ` in ${roomName}` : ""}? This can't be undone.
            </p>
          </div>
          <div className="flex justify-end items-center gap-2 py-3 px-4">
            <GlassButton size="sm" onClick={onClose}>
              Keep booking
            </GlassButton>
            <GlassButton size="sm" tone="danger" onClick={handleConfirm} disabled={loading}>
              {loading ? "Cancelling…" : "Cancel booking"}
            </GlassButton>
          </div>
        </div></div>
      </div>
    </div>,
    document.body
  );
}
