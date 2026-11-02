import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import type { Booking } from "@/hooks/useBookings";
import GlassButton from "@/components/GlassButton";
import { clockTime, formatDuration } from "@/lib/format";

// Opened by clicking a booking in the agenda. Anyone can read the
// details; Edit/Cancel only appear for bookings made in this browser.
export default function BookingDetailModal({
  booking,
  roomName,
  mine,
  onClose,
  onEdit,
  onCancel,
}: {
  booking: Booking;
  roomName: string;
  mine: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const rows: [string, string][] = [
    ["Room", roomName],
    ["Title", booking.title],
    ["Booked by", booking.booked_by],
    ["Date", start.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
    ["Time", `${clockTime(start)} – ${clockTime(end)}`],
    ["Duration", formatDuration(Math.round((end.getTime() - start.getTime()) / 60000))],
  ];

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-md mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="glass-card pointer-events-auto">
          <div className="glass-card-inner !p-0 overflow-hidden rounded-[1.1875rem]">
            <div className="flex justify-between items-center py-3 px-5">
              <p className="text-xl font-bold text-white tracking-tight">Booking details</p>
              <button
                type="button"
                onClick={onClose}
                className="size-8 inline-flex justify-center items-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5"><div className="border-b border-white/25" /></div>
            <dl className="px-5 py-4 flex flex-col gap-3">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="eyebrow">{k}</dt>
                  <dd className="text-[15px] font-medium text-white text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end items-center gap-2 py-3 px-5">
              {mine ? (
                <>
                  <GlassButton size="sm" tone="danger" onClick={onCancel}>
                    <X className="h-4 w-4" />
                    Cancel booking
                  </GlassButton>
                  <GlassButton size="sm" tone="primary" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </GlassButton>
                </>
              ) : (
                <GlassButton size="sm" onClick={onClose}>
                  Close
                </GlassButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
