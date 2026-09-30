import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import type { Booking } from "@/hooks/useBookings";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20; // 8am-8pm covers normal office hours
const HOUR_HEIGHT = 56;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dateLabel(d: Date) {
  const today = startOfDay(new Date());
  const diffDays = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Position/height of a booking block within the day grid, clamped to the
// visible business-hours window so a booking that starts before/ends
// after it doesn't render outside the grid.
function blockStyle(booking: Booking, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

  const start = new Date(Math.max(new Date(booking.starts_at).getTime(), dayStart.getTime()));
  const end = new Date(Math.min(new Date(booking.ends_at).getTime(), dayEnd.getTime()));

  const minutesFromStart = (start.getTime() - dayStart.getTime()) / 60000;
  const durationMinutes = Math.max((end.getTime() - start.getTime()) / 60000, 15);

  return {
    top: (minutesFromStart / 60) * HOUR_HEIGHT,
    height: (durationMinutes / 60) * HOUR_HEIGHT,
  };
}

export function currentStatus(bookings: Booking[]): { busy: boolean; label: string } {
  const now = new Date();
  const current = bookings.find(b => new Date(b.starts_at) <= now && now < new Date(b.ends_at));
  if (current) return { busy: true, label: `Busy until ${formatTime(new Date(current.ends_at))} — ${current.booked_by}` };

  const next = bookings
    .filter(b => new Date(b.starts_at) > now && isSameDay(new Date(b.starts_at), now))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  if (next) return { busy: false, label: `Free until ${formatTime(new Date(next.starts_at))}` };

  return { busy: false, label: "Free for the rest of today" };
}

export default function RoomTimeline({
  bookings,
  myBookingIds,
  onEdit,
  onCancel,
  onSlotClick,
}: {
  bookings: Booking[];
  myBookingIds: Set<string>;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onSlotClick?: (date: Date) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const dayBookings = useMemo(
    () => bookings.filter(b => isSameDay(new Date(b.starts_at), selectedDate)),
    [bookings, selectedDate]
  );

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START_HOUR + i);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setSelectedDate(d => new Date(d.getTime() - 86400000))}
          className="size-8 inline-flex justify-center items-center rounded-lg bg-gray-100 border border-transparent text-gray-800 hover:bg-gray-200 focus:outline-hidden cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{dateLabel(selectedDate)}</span>
          {!isSameDay(selectedDate, new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedDate(d => new Date(d.getTime() + 86400000))}
          className="size-8 inline-flex justify-center items-center rounded-lg bg-gray-100 border border-transparent text-gray-800 hover:bg-gray-200 focus:outline-hidden cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex border border-gray-100 rounded-lg overflow-hidden">
        <div className="shrink-0 w-14 border-r border-gray-100">
          {hours.map(h => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[11px] text-gray-400 text-right pr-2 pt-0.5 border-b border-gray-50 last:border-0">
              {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "am" : "pm"}
            </div>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: HOUR_HEIGHT * TOTAL_HOURS }}>
          {hours.slice(0, -1).map((h, i) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                if (!onSlotClick) return;
                const d = new Date(selectedDate);
                d.setHours(h, 0, 0, 0);
                onSlotClick(d);
              }}
              style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              className="absolute inset-x-0 border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer"
            />
          ))}
          {dayBookings.map(b => {
            const style = blockStyle(b, selectedDate);
            const mine = myBookingIds.has(b.id);
            return (
              <div
                key={b.id}
                style={{ top: style.top, height: Math.max(style.height, 20) }}
                className={`absolute inset-x-1 rounded-md px-2 py-1 overflow-hidden pointer-events-none ${mine ? "bg-blue-100 border border-blue-300" : "bg-gray-200 border border-gray-300"}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[11px] font-medium text-gray-800 truncate">{b.title}</p>
                  {mine && (
                    <div className="flex items-center gap-1 shrink-0 pointer-events-auto -mt-0.5 -mr-0.5">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        title="Edit booking"
                        className="size-5 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(b)}
                        title="Cancel booking"
                        className="size-5 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-red-600 hover:shadow-sm transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 truncate">{b.booked_by}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
