import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRoomBookings, useMyBookingIds, type Booking } from "@/hooks/useBookings";
import RoomTimeline, { currentStatus } from "@/components/RoomTimeline";

export type Room = {
  id: string;
  name: string;
  slug: string;
  location: "office" | "studio";
  capacity: number | null;
  has_tv: boolean | null;
};

const inputCls = "h-9 w-full px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 focus:outline-hidden focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-800 disabled:pointer-events-none";

const DURATIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "1.5 hr", minutes: 90 },
];

function friendlyError(err: unknown): string {
  // Supabase's RPC errors come back as plain PostgrestError-shaped
  // objects ({code, message, details, hint}), not real Error instances
  // — `err instanceof Error` was always false for them, falling through
  // to String(err), which for a plain object is literally the string
  // "[object Object]". Checking for a string .message property instead
  // covers both that shape and real Error instances.
  const message =
    err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : String(err);
  if (message.includes("bookings_no_overlap")) {
    return "This room is already booked for part of that time. Pick a different time, or check the timeline below for an open slot.";
  }
  return message;
}

function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormValues = { title: string; bookedBy: string; date: string; startTime: string; endTime: string };

function BookingForm({
  editing,
  initial,
  onSubmit,
  onCancel,
}: {
  editing?: boolean;
  initial: FormValues;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title || !values.date || !values.startTime || !values.endTime || (!editing && !values.bookedBy)) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        bookedBy: values.bookedBy,
        startsAt: new Date(`${values.date}T${values.startTime}`).toISOString(),
        endsAt: new Date(`${values.date}T${values.endTime}`).toISOString(),
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
      <div className="flex justify-end items-center gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden transition-colors cursor-pointer">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-white/10 bg-neutral-700 text-white shadow-sm hover:bg-neutral-600 focus:outline-hidden transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? "Saving…" : editing ? "Save" : "Book"}
        </button>
      </div>
    </form>
  );
}

function defaultFormValues(date?: Date): FormValues {
  const d = date ?? new Date();
  const start = new Date(d);
  if (!date) { start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1); } // next full hour if no explicit slot
  const end = new Date(start.getTime() + 30 * 60000);
  return { title: "", bookedBy: "", date: toDateInputValue(d), startTime: toTimeInputValue(start), endTime: toTimeInputValue(end) };
}

// Shared between the standalone /rooms/:slug page and the inline
// master/detail view on the home page — same booking form + timeline,
// just embedded in a different surrounding layout by each caller.
export default function RoomDetailPanel({ room, onBack }: { room: Room; onBack: () => void }) {
  const formRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<FormValues>(() => defaultFormValues());
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, cancelBooking } = useRoomBookings(room.id);
  const myBookingIds = useMyBookingIds();
  const status = currentStatus(bookings);

  const handleSlotClick = (date: Date) => {
    setEditingBooking(null);
    setFormValues(defaultFormValues(date));
    setFormKey(k => k + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Time filled in below", { duration: 1500 });
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormValues({
      title: booking.title,
      bookedBy: booking.booked_by,
      date: toDateInputValue(new Date(booking.starts_at)),
      startTime: toTimeInputValue(new Date(booking.starts_at)),
      endTime: toTimeInputValue(new Date(booking.ends_at)),
    });
    setFormKey(k => k + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel "${booking.title}"?`)) return;
    try {
      await cancelBooking(booking.id);
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(friendlyError(err));
    }
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

      <div ref={formRef} className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
        <p className="text-base font-semibold text-gray-800 mb-3">{editingBooking ? "Edit booking" : "Book this room"}</p>
        <BookingForm
          key={formKey}
          editing={!!editingBooking}
          initial={formValues}
          onCancel={editingBooking ? () => { setEditingBooking(null); setFormValues(defaultFormValues()); setFormKey(k => k + 1); } : undefined}
          onSubmit={async input => {
            if (editingBooking) {
              await updateBooking(editingBooking.id, input);
              setEditingBooking(null);
              toast.success("Booking updated");
            } else {
              await createBooking(input);
              toast.success("Booked");
            }
            setFormValues(defaultFormValues());
            setFormKey(k => k + 1);
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
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>
    </div>
  );
}
