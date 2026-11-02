import { CalendarPlus } from "lucide-react";
import GlassButton from "@/components/GlassButton";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";

// "Add to calendar" actions for a booking. Later edits or cancellations
// here don't update a calendar copy, so the note says so.
export default function CalendarButtons({ event }: { event: CalendarEvent }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <GlassButton size="sm" onClick={() => downloadIcs(event)}>
          <CalendarPlus className="h-4 w-4" />
          Add to calendar
        </GlassButton>
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-btn-outer glass-btn-outer--sm"
        >
          <span className="glass-btn">Google Calendar</span>
          <span className="glass-btn-border" aria-hidden>
            <span className="glass-btn-border-glow1" />
            <span className="glass-btn-border-glow2" />
          </span>
        </a>
      </div>
      <p className="mt-2 text-xs text-white/70">A calendar copy won't update if you change or cancel this booking later.</p>
    </div>
  );
}
