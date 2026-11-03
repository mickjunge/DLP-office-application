// "My bookings" lives in localStorage, which is per web address. The app
// used to be reached at the *.vercel.app addresses; bookings made there
// are invisible (no Edit/Cancel) on meetingrooms.davidlewis.nl. So the old
// addresses forward to the new one, carrying the stored edit tokens along
// in the URL hash (never sent to a server), where they get merged back
// into localStorage and removed from the address bar.

const STORAGE_KEY = "office-hub:my-bookings";
const NEW_ORIGIN = "https://meetingrooms.davidlewis.nl";
const OLD_HOSTS = [
  "dlp-office-application.vercel.app",
  "dlp-office-application-david-lewis-productions.vercel.app",
  "dlp-office-application-git-main-david-lewis-productions.vercel.app",
];
const HASH_PREFIX = "#import-bookings=";

type MyBooking = { id: string; editToken: string };

function parse(raw: string | null): MyBooking[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter(b => b && typeof b.id === "string" && typeof b.editToken === "string")
      : [];
  } catch {
    return [];
  }
}

// Returns true if the page is being redirected (caller should not render).
export function migrateBookingsOrigin(): boolean {
  try {
    const { hostname, pathname, search, hash } = window.location;

    if (OLD_HOSTS.includes(hostname)) {
      const mine = parse(localStorage.getItem(STORAGE_KEY));
      const payload = mine.length ? HASH_PREFIX + encodeURIComponent(btoa(JSON.stringify(mine))) : "";
      window.location.replace(NEW_ORIGIN + pathname + search + payload);
      return true;
    }

    if (hash.startsWith(HASH_PREFIX)) {
      const incoming = parse(atob(decodeURIComponent(hash.slice(HASH_PREFIX.length))));
      const have = parse(localStorage.getItem(STORAGE_KEY));
      const known = new Set(have.map(b => b.id));
      const merged = [...have, ...incoming.filter(b => !known.has(b.id))];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      history.replaceState(null, "", pathname + search);
    }
  } catch {
    // Storage blocked or a malformed hash: carry on without importing.
  }
  return false;
}
