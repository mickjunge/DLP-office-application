// Studio (room 03) is switched off for now: not listed, not on the map, not
// reachable at /rooms/:slug, and its bookings stay out of "My bookings".
// Drop the slug from this set to bring it back (also re-enable its fill and
// number in FloorPlan.tsx).
export const HIDDEN_ROOM_SLUGS = new Set(["studio"]);
