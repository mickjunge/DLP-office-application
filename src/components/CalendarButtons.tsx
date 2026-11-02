import { useState } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import GlassButton from "@/components/GlassButton";
import { downloadIcs, googleCalendarUrl, outlookUrl, type CalendarEvent } from "@/lib/calendar";

const rowCls =
  "w-full text-left px-4 py-2.5 text-sm rounded-full border border-white/25 bg-white/[0.04] text-white hover:bg-white/15 transition-colors cursor-pointer";

// One "Add to calendar" button that opens a short list of calendars to pick
// from. Calendar copies are a snapshot: later edits or cancellations here
// don't update them, so the note says so.
export default function CalendarButtons({ event }: { event: CalendarEvent }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div>
      <GlassButton size="sm" className="w-full" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <CalendarPlus className="h-4 w-4" />
        Add to calendar
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </GlassButton>

      {open && (
        <div className="mt-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <button type="button" className={rowCls} onClick={() => { downloadIcs(event); close(); }}>
            Apple Calendar / Outlook app <span className="text-white/60">(.ics file)</span>
          </button>
          <a className={rowCls} href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" onClick={close}>
            Google Calendar
          </a>
          <a className={rowCls} href={outlookUrl(event, "work")} target="_blank" rel="noopener noreferrer" onClick={close}>
            Outlook <span className="text-white/60">(work or school)</span>
          </a>
          <a className={rowCls} href={outlookUrl(event, "personal")} target="_blank" rel="noopener noreferrer" onClick={close}>
            Outlook.com <span className="text-white/60">(personal)</span>
          </a>
        </div>
      )}

      <p className="mt-2 text-xs text-white/70">A calendar copy won't update if you change or cancel this booking later.</p>
    </div>
  );
}
