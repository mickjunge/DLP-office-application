import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking } from "@/hooks/useBookings";
import { companyName } from "@/lib/companies";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20; // 8am-8pm covers normal office hours
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

// 24h, matching the time fields in the booking form and confirmation popup.
function shortTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    // percentages of the grid's height, so the day scales to whatever
    // height the agenda card is stretched to
    top: (minutesFromStart / (TOTAL_HOURS * 60)) * 100,
    height: (durationMinutes / (TOTAL_HOURS * 60)) * 100,
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
  onSlotClick,
  onSelect,
}: {
  bookings: Booking[];
  myBookingIds: Set<string>;
  onSlotClick?: (date: Date) => void;
  // Click a booking block to open its details.
  onSelect?: (booking: Booking) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const dayBookings = useMemo(
    () => bookings.filter(b => isSameDay(new Date(b.starts_at), selectedDate)),
    [bookings, selectedDate]
  );

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setSelectedDate(d => new Date(d.getTime() - 86400000))}
          className="size-9 max-md:size-11 inline-flex justify-center items-center rounded-full border border-white/35 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">{dateLabel(selectedDate)}</span>
          {!isSameDay(selectedDate, new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
              className="text-sm text-white underline underline-offset-2 hover:text-white cursor-pointer"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedDate(d => new Date(d.getTime() + 86400000))}
          className="size-9 max-md:size-11 inline-flex justify-center items-center rounded-full border border-white/35 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 min-h-[40rem] border border-white/30 rounded-xl overflow-hidden bg-black/30">
        <div className="shrink-0 w-14 flex flex-col border-r border-white/25">
          {hours.map(h => (
            <div key={h} className="flex-1 text-xs text-white/90 text-right pr-2 pt-0.5 border-b border-white/15 last:border-0">
              {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "am" : "pm"}
            </div>
          ))}
        </div>
        <div className="relative flex-1 self-start" style={{ height: `${(TOTAL_HOURS / (TOTAL_HOURS + 1)) * 100}%` }}>
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
              style={{ top: `${(i / TOTAL_HOURS) * 100}%`, height: `${100 / TOTAL_HOURS}%` }}
              className="absolute inset-x-0 border-b border-white/15 hover:bg-white/[0.1] transition-colors cursor-pointer"
            />
          ))}
          {dayBookings.map(b => {
            const style = blockStyle(b, selectedDate);
            const mine = myBookingIds.has(b.id);
            // The agenda shows the company (full name); the title is in the details popup.
            const label = companyName(b.company) ?? b.title;
            const timeRange = `${shortTime(new Date(b.starts_at))} – ${shortTime(new Date(b.ends_at))}`;
            const minutes = (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000;
            // Blocks are sized exactly to their time span (no minimum height,
            // so a short booking can never spill over the next one); the
            // content just gets more compact as the block gets shorter:
            //   <= 15 min: one tiny line, no buttons (open it for details)
            //   <= 30 min: one line with the time
            //   longer:    title line + time/name line
            const tiny = minutes <= 15;
            const short = minutes <= 30;
            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(b)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(b); } }}
                title={`${label}${b.company ? ` — ${b.title}` : ""} · ${timeRange} · ${b.booked_by} — click for details`}
                style={{ top: `calc(${style.top}% + 1px)`, height: `calc(${style.height}% - 2px)` }}
                className={`absolute inset-x-1 rounded-md px-2 overflow-hidden cursor-pointer transition-all duration-150 hover:z-10 hover:scale-[1.02] hover:shadow-[0_0_0_2px_rgba(255,255,255,0.95),0_6px_20px_rgba(0,0,0,0.5)] ${
                  tiny ? "flex items-center" : short ? "py-0.5 border" : "py-1 border"
                } ${mine ? "bg-white/90 border-white hover:bg-white" : "bg-white/30 border-white/50 hover:bg-white/50"}`}
              >
                <div className={tiny ? "w-full" : ""}>
                  <p className={`${tiny ? "text-[11px] leading-[11px]" : short ? "text-xs leading-tight" : "text-[13px]"} font-semibold ${mine ? "text-black" : "text-white"} truncate`}>
                    {label}
                    {short && <span className="font-normal"> · {timeRange}</span>}
                  </p>
                </div>
                {!short && (
                  <p className={`text-xs ${mine ? "text-black/80" : "text-white"} truncate`}>{timeRange} · {b.booked_by}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
