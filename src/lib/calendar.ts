// "Add to calendar" for a booking: an .ics file (Apple Calendar, Outlook and
// most others) or a prefilled Google Calendar link. Built entirely in the
// browser — there's no login or email on bookings, so nothing is sent.
// The copy in someone's calendar is a snapshot: later edits/cancellations
// here don't update it.

export type CalendarEvent = {
  title: string;
  roomName: string;
  bookedBy: string;
  startsAt: Date;
  endsAt: Date;
};

const LOCATION = "David Lewis Productions";

function utc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function details(e: CalendarEvent) {
  return `Booked by ${e.bookedBy} in ${e.roomName}.`;
}

function place(e: CalendarEvent) {
  return `${e.roomName}, ${LOCATION}`;
}

function escapeText(s: string) {
  const BS = "\\"; // a single backslash
  return s
    .split(BS).join(BS + BS)
    .split(";").join(BS + ";")
    .split(",").join(BS + ",")
    .replace(/\r?\n/g, BS + "n");
}

// RFC 5545: lines over 75 octets are folded with CRLF + space.
function fold(line: string) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = ch;
    } else cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

export function buildIcs(e: CalendarEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//David Lewis Productions//Office Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@office-hub`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(e.startsAt)}`,
    `DTEND:${utc(e.endsAt)}`,
    `SUMMARY:${escapeText(e.title)}`,
    `LOCATION:${escapeText(place(e))}`,
    `DESCRIPTION:${escapeText(details(e))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(e: CalendarEvent) {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.roomName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-booking.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(e: CalendarEvent) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${utc(e.startsAt)}/${utc(e.endsAt)}`,
    details: details(e),
    location: place(e),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

// Outlook on the web "new event" page, prefilled. Work/school (Microsoft 365)
// and personal (outlook.com) accounts live on different hosts.
export function outlookUrl(e: CalendarEvent, account: "work" | "personal") {
  const host = account === "work" ? "outlook.office.com" : "outlook.live.com";
  const q = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.startsAt.toISOString(),
    enddt: e.endsAt.toISOString(),
    body: details(e),
    location: place(e),
  });
  return `https://${host}/calendar/0/deeplink/compose?${q.toString()}`;
}
