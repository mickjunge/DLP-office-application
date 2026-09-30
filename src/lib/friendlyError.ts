export function friendlyError(err: unknown): string {
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
