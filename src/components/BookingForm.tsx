import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Booking } from "@/hooks/useBookings";
import { friendlyError } from "@/lib/friendlyError";
import GlassButton from "@/components/GlassButton";
import ConfirmBookingModal from "@/components/ConfirmBookingModal";
import { COMPANIES } from "@/lib/companies";

const inputCls = "glass-input";

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

export type FormValues = { title: string; company: string; bookedBy: string; date: string; startTime: string; endTime: string };

export function defaultFormValues(date?: Date): FormValues {
  const d = date ?? new Date();
  const start = new Date(d);
  if (!date) { start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1); } // next full hour if no explicit slot
  const end = new Date(start.getTime() + 30 * 60000);
  return { title: "", company: "", bookedBy: "", date: toDateInputValue(d), startTime: toTimeInputValue(start), endTime: toTimeInputValue(end) };
}

export function bookingToFormValues(booking: Booking): FormValues {
  return {
    title: booking.title,
    company: booking.company ?? "",
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
  roomName,
  slotPrefill,
  initial,
  bookings,
  excludeBookingId,
  onSubmit,
  onBooked,
  onCancel,
}: {
  editing?: boolean;
  // When set (creating, not editing), "Book" first opens a confirmation
  // popup listing the room and every detail before the booking is made.
  roomName?: string;
  // Clicking a slot in the agenda: applies just the date and start time
  // (keeping the chosen duration) without touching the other fields.
  slotPrefill?: { date: Date };
  initial: FormValues;
  bookings: Booking[];
  excludeBookingId?: string;
  onSubmit: (input: { title: string; company: string | null; bookedBy: string; startsAt: string; endsAt: string }) => Promise<void>;
  // Creating only: called after the success animation in the confirmation popup.
  onBooked?: () => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState(false);
  useEffect(() => {
    if (!slotPrefill) return;
    setValues(prev => {
      const [sh, sm] = prev.startTime.split(":").map(Number);
      const [eh, em] = prev.endTime.split(":").map(Number);
      const minutes = eh * 60 + em - (sh * 60 + sm);
      const duration = minutes > 0 ? minutes : 30;
      const start = slotPrefill.date;
      const end = new Date(start.getTime() + duration * 60000);
      return { ...prev, date: toDateInputValue(start), startTime: toTimeInputValue(start), endTime: toTimeInputValue(end) };
    });
  }, [slotPrefill]);

  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) => setValues(prev => ({ ...prev, [key]: v }));

  const applyDuration = (minutes: number) => {
    if (!values.startTime) return;
    const [h, m] = values.startTime.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    set("endTime", `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
  };

  // Company is required for new bookings; older bookings (no company) can be
  // edited without picking one.
  const isComplete = !!(values.title && values.date && values.startTime && values.endTime && (editing || (values.bookedBy && values.company)));
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
  // End must be after start. Booking is blocked, and a toast explains why.
  const invalidRange = !!(startsAt && endsAt && endsAt <= startsAt);
  // When editing, Save only does something once a field differs from the
  // booking as it was opened (the name isn't editable, so it's not compared).
  const changed =
    values.title !== initial.title ||
    values.company !== initial.company ||
    values.date !== initial.date ||
    values.startTime !== initial.startTime ||
    values.endTime !== initial.endTime;
  const canSubmit = isComplete && !hasConflict && !invalidRange && !submitting && (!editing || changed);

  // Short delay so it doesn't fire halfway through typing a time; the fixed
  // id means repeated edits update one toast instead of stacking several.
  useEffect(() => {
    if (!invalidRange) {
      toast.dismiss("time-range");
      return;
    }
    const t = setTimeout(() => toast.error("End time must be after the start time", { id: "time-range" }), 600);
    return () => clearTimeout(t);
  }, [invalidRange, values.date, values.startTime, values.endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (roomName && !editing) setConfirming(true);
    else void doSubmit();
  };

  // Backing out of the confirmation just closes it; dismissing the success
  // view finishes the booking flow and lets the parent reset the form.
  const closeConfirm = () => {
    setConfirming(false);
    if (booked) {
      setBooked(false);
      onBooked?.();
    }
  };

  const doSubmit = async () => {
    if (!startsAt || !endsAt) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        company: values.company || null,
        bookedBy: values.bookedBy,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      if (confirming) {
        // Show the white check (with "add to calendar") inside the popup
        // instead of a toast; it stays until dismissed — see closeConfirm.
        setBooked(true);
      }
    } catch (err) {
      toast.error(friendlyError(err));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
      <div>
        <label className="block mb-2 eyebrow">Title<span className="text-white/40 ml-0.5">*</span></label>
        <input className={inputCls} value={values.title} onChange={e => set("title", e.target.value)} placeholder="Title" />
      </div>
      <div>
        <label className="block mb-2 eyebrow">Company{!editing && <span className="text-white/40 ml-0.5">*</span>}</label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Company">
          {COMPANIES.map(c => (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={values.company === c.code}
              onClick={() => set("company", values.company === c.code && editing ? "" : c.code)}
              title={c.name}
              className={`h-10 px-5 text-sm rounded-full border transition-colors cursor-pointer ${
                values.company === c.code
                  ? "bg-white text-black border-white font-semibold"
                  : "border-white/25 bg-white/[0.04] text-white/85 hover:bg-white/15 hover:text-white"
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>
      {!editing && (
        <div>
          <label className="block mb-2 eyebrow">Your name<span className="text-white/70 ml-0.5">*</span></label>
          <input className={inputCls} value={values.bookedBy} onChange={e => set("bookedBy", e.target.value)} placeholder="Your name" />
        </div>
      )}
      <div>
        <label className="block mb-2 eyebrow">Date<span className="text-white/70 ml-0.5">*</span></label>
        <input type="date" className={inputCls} value={values.date} onChange={e => set("date", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-2 eyebrow">Start<span className="text-white/70 ml-0.5">*</span></label>
          <input type="time" className={inputCls} value={values.startTime} onChange={e => set("startTime", e.target.value)} />
        </div>
        <div>
          <label className="block mb-2 eyebrow">End<span className="text-white/70 ml-0.5">*</span></label>
          <input type="time" className={inputCls} value={values.endTime} onChange={e => set("endTime", e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 -mt-1">
        {DURATIONS.map(d => (
          <button
            key={d.label}
            type="button"
            onClick={() => applyDuration(d.minutes)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 bg-white/[0.04] text-white/92 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            {d.label}
          </button>
        ))}
      </div>
      {hasConflict && (
        <p className="text-xs text-red-400 text-right -mb-1">
          This time overlaps an existing booking for this room — pick a different time.
        </p>
      )}
      <div className="flex justify-end items-center gap-2 mt-auto pt-2">
        {onCancel && (
          <GlassButton size="sm" onClick={onCancel}>
            Cancel
          </GlassButton>
        )}
        <GlassButton type="submit" size="sm" tone={hasConflict ? "danger" : "primary"} disabled={!canSubmit}>
          {submitting ? "Saving…" : editing ? "Save" : "Book"}
        </GlassButton>
      </div>
      {confirming && startsAt && endsAt && roomName && (
        <ConfirmBookingModal
          roomName={roomName}
          title={values.title}
          company={values.company}
          bookedBy={values.bookedBy}
          startsAt={startsAt}
          endsAt={endsAt}
          submitting={submitting}
          booked={booked}
          onClose={closeConfirm}
          onConfirm={doSubmit}
        />
      )}
    </form>
  );
}
