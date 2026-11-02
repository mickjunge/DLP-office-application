import { createPortal } from "react-dom";
import { X } from "lucide-react";
import GlassButton from "@/components/GlassButton";
import { clockTime, formatDuration } from "@/lib/format";
import { companyName } from "@/lib/companies";
import CalendarButtons from "@/components/CalendarButtons";

// Final check before a new booking is created: shows everything that
// will be saved so a wrong room/time is caught before it's booked.
export default function ConfirmBookingModal({
  roomName,
  title,
  company,
  bookedBy,
  startsAt,
  endsAt,
  submitting,
  booked,
  onClose,
  onConfirm,
}: {
  roomName: string;
  title: string;
  company: string;
  bookedBy: string;
  startsAt: Date;
  endsAt: Date;
  submitting: boolean;
  // true once the booking is saved: swaps the details for a white check.
  booked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const time = clockTime;
  const rows: [string, string][] = [
    ["Room", roomName],
    ["Title", title],
    ...(company ? ([["Company", companyName(company) ?? company]] as [string, string][]) : []),
    ["Booked by", bookedBy],
    ["Date", startsAt.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
    ["Time", `${time(startsAt)} – ${time(endsAt)}`],
    ["Duration", formatDuration(Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))],
  ];

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-md mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="glass-card pointer-events-auto">
          <div className="glass-card-inner !p-0 overflow-hidden rounded-[1.1875rem]">
            {booked ? (
              <div className="flex flex-col items-center justify-center gap-4 px-5 py-10 animate-in fade-in duration-300">
                <svg viewBox="0 0 32 32" className="size-24" shapeRendering="geometricPrecision">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#ffffff" strokeWidth="1.6" className="success-check-circle" style={{ strokeDasharray: 88 }} />
                  <path d="M9.5 16.5 L14 21 L22.5 11.5" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
                </svg>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white tracking-tight">Booked</p>
                  <p className="text-[15px] text-white/85 mt-1">
                    {roomName} · {time(startsAt)} – {time(endsAt)}
                  </p>
                </div>
                <div className="w-full pt-2">
                  <CalendarButtons event={{ title, roomName, bookedBy, company: companyName(company), startsAt, endsAt }} />
                </div>
                <GlassButton tone="primary" onClick={onClose} className="mt-1">
                  Done
                </GlassButton>
              </div>
            ) : (
            <>
            <div className="flex justify-between items-center py-3 px-5">
              <p className="text-xl font-bold text-white tracking-tight">Confirm your booking</p>
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
              <GlassButton size="sm" onClick={onClose}>
                Go back
              </GlassButton>
              <GlassButton size="sm" tone="primary" onClick={onConfirm} disabled={submitting}>
                {submitting ? "Booking…" : "Confirm booking"}
              </GlassButton>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
