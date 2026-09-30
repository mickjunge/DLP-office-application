import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoomBookings, useMyBookingIds, type Booking } from "@/hooks/useBookings";

type Room = {
  id: string;
  name: string;
  slug: string;
  location: "office" | "studio";
  capacity: number | null;
};

const inputCls = "h-9 w-full px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 focus:outline-hidden focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-800 disabled:pointer-events-none";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("bookings_no_overlap")) return "That room is already booked for part of this time — pick another slot.";
  return message;
}

function BookingForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; bookedBy?: string; startsAt: string; endsAt: string };
  submitLabel: string;
  onSubmit: (input: { title: string; bookedBy: string; startsAt: string; endsAt: string }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [bookedBy, setBookedBy] = useState(initial?.bookedBy ?? "");
  const [startsAt, setStartsAt] = useState(initial ? toLocalInputValue(initial.startsAt) : "");
  const [endsAt, setEndsAt] = useState(initial ? toLocalInputValue(initial.endsAt) : "");
  const [submitting, setSubmitting] = useState(false);
  const showBookedBy = initial?.bookedBy === undefined ? true : false; // hide on edit, name doesn't change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startsAt || !endsAt || (showBookedBy && !bookedBy)) return;
    setSubmitting(true);
    try {
      await onSubmit({ title, bookedBy, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() });
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
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team standup" autoFocus />
      </div>
      {showBookedBy && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">Your name<span className="text-red-400 ml-0.5">*</span></label>
          <input className={inputCls} value={bookedBy} onChange={e => setBookedBy(e.target.value)} placeholder="e.g. Mick" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">Starts<span className="text-red-400 ml-0.5">*</span></label>
          <input type="datetime-local" className={inputCls} value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-800">Ends<span className="text-red-400 ml-0.5">*</span></label>
          <input type="datetime-local" className={inputCls} value={endsAt} onChange={e => setEndsAt(e.target.value)} />
        </div>
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
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function BookingRow({
  booking,
  isMine,
  onUpdate,
  onCancel,
}: {
  booking: Booking;
  isMine: boolean;
  onUpdate: (id: string, input: { title: string; startsAt: string; endsAt: string }) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm(`Cancel "${booking.title}"?`)) return;
    setCancelling(true);
    try {
      await onCancel(booking.id);
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setCancelling(false);
    }
  };

  if (editing) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <BookingForm
          initial={{ title: booking.title, startsAt: booking.starts_at, endsAt: booking.ends_at }}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async input => {
            await onUpdate(booking.id, input);
            setEditing(false);
            toast.success("Booking updated");
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{booking.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(booking.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} – {new Date(booking.ends_at).toLocaleTimeString([], { timeStyle: "short" })} · {booking.booked_by}
        </p>
      </div>
      {isMine && (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setEditing(true)} title="Edit" className="size-8 inline-flex justify-center items-center rounded-lg bg-gray-100 border border-transparent text-gray-800 hover:bg-gray-200 focus:outline-hidden cursor-pointer">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={handleCancel} disabled={cancelling} title="Cancel" className="size-8 inline-flex justify-center items-center rounded-lg bg-gray-100 border border-transparent text-gray-800 hover:bg-gray-200 focus:outline-hidden cursor-pointer disabled:opacity-40">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function RoomDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["room", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data as Room;
    },
    enabled: !!slug,
  });

  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, cancelBooking } = useRoomBookings(room?.id);
  const myBookingIds = useMyBookingIds();

  return (
    <div className="min-h-screen bg-[#f9f9f9] px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to floorplan
        </Link>

        <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
          {roomLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !room ? (
            <p className="text-sm text-gray-500">Room not found.</p>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-800">{room.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {room.capacity ? `${room.capacity} seats · ` : ""}{room.location === "studio" ? "Studio" : "Office"}
              </p>
            </>
          )}
        </div>

        {room && (
          <>
            <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
              <p className="text-base font-semibold text-gray-800 mb-3">Book this room</p>
              <BookingForm
                submitLabel="Book"
                onSubmit={async input => {
                  await createBooking(input);
                  toast.success("Booked");
                }}
              />
            </div>

            <div className="mt-4 bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4">
              <p className="text-base font-semibold text-gray-800 mb-1">Upcoming bookings</p>
              {bookingsLoading ? (
                <p className="text-sm text-gray-500 mt-2">Loading…</p>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">Nothing booked yet.</p>
              ) : (
                <div className="mt-2">
                  {bookings.map(b => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      isMine={myBookingIds.has(b.id)}
                      onUpdate={updateBooking}
                      onCancel={cancelBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
