import { createPortal } from "react-dom";
import { X } from "lucide-react";
import GlassButton from "@/components/GlassButton";

// Explains why a booking might not show up under "My bookings": there is
// no login, so ownership is a secret kept in the browser it was made from.
export default function FindBookingModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="mt-7 w-full max-w-md mx-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="glass-card pointer-events-auto"><div className="glass-card-inner !p-0 overflow-hidden rounded-[1.1875rem]">
          <div className="flex justify-between items-center py-3 px-4">
            <p className="eyebrow !text-white">Can't find your booking?</p>
            <button
              type="button"
              onClick={onClose}
              className="size-8 inline-flex justify-center items-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 shrink-0">
            <div className="border-b border-white/15" />
          </div>
          <div className="p-4 flex flex-col gap-3 text-sm leading-relaxed text-white/92">
            <p>
              There is no login, so a booking is linked to the browser you made it in. Only that browser can show it under My bookings and offer Edit and Cancel.
            </p>
            <p className="text-white font-medium">Your booking won't show up if you:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-white/85">
              <li>Booked on another device, or in another browser (for example Safari instead of Chrome).</li>
              <li>Booked at a different web address. Always use meetingrooms.davidlewis.nl; bookings made on an older address (ending in vercel.app) only show there.</li>
              <li>Booked in a private or incognito window.</li>
              <li>Cleared your cookies, history or site data since. In Safari, clearing history also wipes this.</li>
              <li>Use Safari and haven't visited in about a week. Safari can erase this data by itself.</li>
            </ul>
            <p>
              Your booking is still in the room's timeline for everyone to see. To change it, open the browser or address you booked from. If that's no longer possible, ask the person who maintains this page to change it for you.
            </p>
          </div>
          <div className="px-4 shrink-0">
            <div className="border-b border-white/15" />
          </div>
          <div className="flex justify-end py-3 px-4">
            <GlassButton size="sm" tone="primary" onClick={onClose}>Got it</GlassButton>
          </div>
        </div></div>
      </div>
    </div>,
    document.body
  );
}
