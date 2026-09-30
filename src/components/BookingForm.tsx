import { useState } from "react";
import { toast } from "sonner";
import type { Booking } from "@/hooks/useBookings";
import { friendlyError } from "@/lib/friendlyError";

const inputCls = "h-9 w-full px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 focus:outline-hidden focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-800 disabled:pointer-events-none";

const DURATIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "1.5 hr", minutes: 90 },
];

export function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function toTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type FormValues = { title: string; bookedBy: string; date: string; startTime: string; endTime: string };

export function defaultFormValues(date?: Date): FormValues {
  const d = date ?? new Date();
  const start = new Date(d);
  if (!date) { start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1); } // next full hour if no explicit slot
  const end = new Date(start.getTime() + 30 * 60000);
  return { title: "", bookedBy: "", date: toDateInputValue(d), startTime: toTimeInputValue(start), endTime: toTimeInputValue(end) };
}

export function bookingToFormValues(booking: Booking): FormValues {
  return {
    title: booking.title,
    bookedBy: booking.booked_by,
    date: toDateInputValue(new Date(booking.starts_at)),
    startTime: toTimeInputValue(new Date(booking.starts_at)),
    endTime: toTimeInputValue(new Date(booking.ends_at)),
  };
}

// True if [startsAt, endsAt) overlaps any of the room's existing
// bookings other than the one being edited (excludeBookingId).
function overlapsExisting(bookings: Booking[], startsAt: Date, endsAt: Date, excludeBookingId?: string): boolean {
  return bookings.some(b => {
    if (b.id === excludeBookingId) return false;
    return startsAt < new Date(b.ends_at) && endsAt > new Date(b.starts_at);
  });
}

// Used for both creating a booking (inline, on the room's own page)
// and editing one (inside EditBookingModal) — same fields, same
// client-side conflict check against bookings already loaded for the
// room, just a different submit handler and initial values per caller.
export default function BookingForm({
  editing,
  initial,
  bookings,
  excludeBookingId,
  onSubmit,
  onCancel,
}: {
  editing?: boolean;
  initial: FormValues;
  bookings: Booking[];
  excludeBookingId?: string;
  onSubmit: (input: { title: string; bookedBy: string; startsAt: string; endsAt: string }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) => setValues(prev => ({ ...prev, [key]: v }));

  const applyDuration = (minutes: number) => {
    if (!values.startTime) return;
    const [h, m] = values.startTime.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    set("endTime", `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
  };

  const isComplete = !!(values.title && values.date && values.startTime && values.endTime && (editing || values.bookedBy));
  // Client-side check against the bookings already loaded for this
  // room — catches the common case (picking an obviously-taken slot)
  // before ever submitting. The server-side exclusion constraint still
  // has the final say (see friendlyError below) for the rare race where
  // someone else books the same slot in between — that's a toast, since
  // there's nothing to point the button at once it's already in flight.
  const startsAt = values.date && values.startTime ? new Date(`${values.date}T${values.startTime}`) : null;
  const endsAt = values.date && values.endTime ? new Date(`${values.date}T${values.endTime}`) : null;
  const hasConflict =
    isComplete && startsAt && endsAt && endsAt > startsAt && overlapsExisting(bookings, startsAt, endsAt, excludeBookingId);
  const canSubmit = isComplete && !hasConflict && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !startsAt || !endsAt) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        bookedBy: values.bookedBy,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-800">Title<span className="text-red-400 ml-0.5">*</span></label>
        <input className={inputCls} value={values.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Team standup" />
      </div>
      {!editing && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">Your name<span className="text-red-400 ml-0.5">*</span></label>
          <input className={inputCls} value={values.bookedBy} onChange={e => set("bookedBy", e.target.value)} placeholder="e.g. Mick" />
        </div>
      )}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-800">Date<span className="text-red-400 ml-0.5">*</span></label>
        <input type="date" className={inputCls} value={values.date} onChange={e => set("date", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">Start<span className="text-red-400 ml-0.5">*</span></label>
          <input type="time" className={inputCls} value={values.startTime} onChange={e => set("startTime", e.target.value)} />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">End<span className="text-red-400 ml-0.5">*</span></label>
          <input type="time" className={inputCls} value={values.endTime} onChange={e => set("endTime", e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 -mt-1">
        {DURATIONS.map(d => (
          <button
            key={d.label}
            type="button"
            onClick={() => applyDuration(d.minutes)}
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {d.label}
          </button>
        ))}
      </div>
      {hasConflict && (
        <p className="text-xs text-red-600 text-right -mb-1">
          This time overlaps an existing booking for this room — pick a different time.
        </p>
      )}
      <div className="flex justify-end items-center gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden transition-colors cursor-pointer">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border shadow-sm focus:outline-hidden transition-colors cursor-pointer disabled:pointer-events-none ${
            hasConflict
              ? "border-red-700/10 bg-red-600 text-white disabled:opacity-60"
              : "border-white/10 bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-40"
          }`}
        >
          {submitting ? "Saving…" : editing ? "Save" : "Book"}
        </button>
      </div>
    </form>
  );
}
