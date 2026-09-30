import { useEffect, useState } from "react";
import { useAnimatedViewBox, type ViewBox } from "@/hooks/useAnimatedViewBox";

const FULL_BUILDING: ViewBox = [-1040.5, 14.5, 1029, 1136];
const OVERVIEW: ViewBox = [-730, 253, 569, 818];
const ROOM_ZOOM: Record<string, ViewBox> = {
  "small-conference-room": [-630, 308, 266, 277],
  "big-conference-room": [-675, 455, 315, 348],
  studio: [-452, 745, 236, 271],
};

export type RoomSlug = keyof typeof ROOM_ZOOM;

// Traced 1:1 from the real floor plan by hand in Illustrator (source:
// /Users/mickjunge/Documents/mockups DLP digital poster/floorplan_slick.svg),
// not measured/approximated like the earlier version. Only three rooms are
// bookable — everything else is static line art for context.
export default function FloorPlan({
  zoomTo,
  onSelectRoom,
  busySlugs,
}: {
  zoomTo: "overview" | RoomSlug;
  onSelectRoom?: (slug: RoomSlug) => void;
  // Rooms with a booking active right now — only colored green/red on
  // the overview. Once zoomed into a specific room, that room's own
  // detail panel already shows its status, so the shape reverts to the
  // neutral blue tint rather than showing red under your own booking.
  busySlugs?: Set<RoomSlug>;
}) {
  // Holds at the full building for a beat on first mount (so the intro
  // reads as "see the whole plan, then zoom in") before handing control
  // to whatever zoomTo actually is. After that first flip, target just
  // tracks zoomTo directly — including switching between rooms, or back
  // to the overview, each re-targeting the same in-flight tween rather
  // than restarting from scratch.
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 300);
    return () => clearTimeout(t);
  }, []);
  const target = !introDone ? FULL_BUILDING : zoomTo === "overview" ? OVERVIEW : ROOM_ZOOM[zoomTo];
  const viewBox = useAnimatedViewBox(target, FULL_BUILDING, 900);
  // Overview: every room shows its live status. Zoomed into a specific
  // room: only that room keeps its status color — the others (mostly
  // out of frame anyway, but sometimes partially visible at the edges)
  // revert to the plain neutral tint instead of showing red/green for
  // a room that isn't the one being looked at.
  const roomClass = (slug: RoomSlug) => {
    const showStatus = zoomTo === "overview" || zoomTo === slug;
    return showStatus ? (busySlugs?.has(slug) ? "status-busy" : "status-available") : "bookable";
  };

  return (
    // Fills the entire viewport (w-full h-full, absolute inset-0). Uses
    // preserveAspectRatio="meet" (the default) rather than "slice": slice
    // crops whichever axis overflows to guarantee full coverage, which
    // for this portrait-shaped room crop inside a landscape browser
    // window cropped away Studio almost entirely. Meet always shows the
    // complete viewBox, letterboxing only the shorter axis — and since
    // that letterbox is plain white against a white page, it's invisible
    // rather than looking like a visible box.
    <svg
      viewBox={viewBox.join(" ")}
      preserveAspectRatio="xMaxYMid meet"
      className="absolute inset-0 w-full h-full select-none"
    >
      <style>{`
        .bookable { fill: #eff6ff; cursor: pointer; transition: fill .2s ease; }
        .bookable:hover { fill: #dbeafe; }
        .status-available { fill: #dcfce7; cursor: pointer; transition: fill .2s ease; }
        .status-available:hover { fill: #bbf7d0; }
        .status-busy { fill: #fee2e2; cursor: pointer; transition: fill .2s ease; }
        .status-busy:hover { fill: #fecaca; }
        .room-number { font-family: Inter, "Helvetica Neue", Arial, sans-serif; font-size: 22px; font-weight: 700; fill: #111111; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
      `}</style>
      <rect x={-1066} y={-11} width={1080} height={1187} fill="#fff" />
      <g transform="rotate(90)">
        <rect x={37} y={34} width={1091} height={984} fill="#fff" />

        <g id="rooms">
          <rect x={37} y={34} width={1091} height={203} fill="#F9FAFB" />
          <rect x={37} y={237} width={159} height={193} fill="#F9FAFB" />
          <rect x={37} y={515} width={138} height={105} fill="#F9FAFB" />
          <rect x={175} y={515} width={87} height={105} fill="#F9FAFB" />
          <rect x={37} y={620} width={206} height={195} fill="#F9FAFB" />
          <rect x={373} y={565} width={147} height={65} fill="#F9FAFB" />
          <rect x={810} y={425} width={202} height={205} fill="#F9FAFB" />
          <rect x={1012} y={430} width={116} height={256} fill="#F9FAFB" />
          <rect x={1012} y={686} width={116} height={129} fill="#F9FAFB" />
          <rect x={370} y={666} width={569} height={135} fill="#F9FAFB" />
          <rect x={37} y={815} width={203} height={203} fill="#F9FAFB" />
          <rect x={240} y={877} width={257} height={141} fill="#F9FAFB" />
          <rect x={497} y={877} width={252} height={141} fill="#F9FAFB" />
          <rect x={749} y={877} width={133} height={141} fill="#F9FAFB" />
          <rect x={882} y={877} width={126} height={141} fill="#F9FAFB" />
          <rect x={1008} y={877} width={120} height={141} fill="#F9FAFB" />

          {/* Bookable rooms — inset 3 units from the room's true bounds
              so the fill sits inside the wall lines instead of bleeding
              under/past them (walls have real thickness, drawn straddling
              the room boundary). Sharp corners (no rx) to match the real
              architecture — see the earlier fix for why a rounded fill
              read as wrong here. */}
          <rect x={813} y={284} width={135} height={100} className={roomClass("studio")} onClick={() => onSelectRoom?.("studio")} />
          <rect x={376} y={432} width={141} height={130} className={roomClass("small-conference-room")} onClick={() => onSelectRoom?.("small-conference-room")} />
          <rect x={523} y={428} width={212} height={179} className={roomClass("big-conference-room")} onClick={() => onSelectRoom?.("big-conference-room")} />
        </g>

        {/* Only the furniture inside the two bookable conference rooms is
            kept (it signals room character — round vs. long table); all
            other architectural detail (desk clusters, toilet fixtures,
            elevator/stair hatching, kitchen counters) was removed as
            visual noise that made this read as a technical drawing
            instead of a booking-app map. */}
        <g id="furniture">
          <circle cx={447} cy={493} r={31} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <rect x={573} y={497} width={132} height={41} rx={3} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />

          {/* Chairs — 5 around the round table (matches capacity 5),
              6 per long side of the rectangular table (12 total, matches
              capacity 12). Positions computed from the table geometry
              above, not eyeballed. */}
          <circle cx={447} cy={452} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={486} cy={480.3} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={471.1} cy={526.2} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={422.9} cy={526.2} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={408} cy={480.3} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />

          <circle cx={584} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={606} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={628} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={650} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={672} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={694} cy={486} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={584} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={606} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={628} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={650} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={672} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
          <circle cx={694} cy={549} r={6} fill="#FFFFFF" stroke="#9CA3AF" strokeWidth={0.8} />
        </g>

        <path
          fill="#374151"
          fillRule="evenodd"
          d="M1130.50 34.00 L1130.50 31.50 L1125.50 31.50 L39.50 31.50 L37.00 31.50 L34.50 31.50 L34.50 36.50 L34.50 1015.50 L34.50 1018.00 L34.50 1020.50 L39.50 1020.50 L1125.50 1020.50 L1128.00 1020.50 L1130.50 1020.50 L1130.50 1015.50 L1130.50 36.50 L1130.50 34.00Z M430.62 238.38 L433.38 238.38 L622.62 238.38 L625.38 238.38 L815.62 238.38 L818.38 238.38 L1007.62 238.38 L1010.38 238.38 L1125.50 238.38 L1125.50 428.62 L1014.50 428.62 L1014.50 427.50 L1014.50 425.00 L1014.50 422.50 L1009.50 422.50 L812.50 422.50 L810.00 422.50 L807.50 422.50 L807.50 427.50 L807.50 627.50 L807.50 630.00 L807.50 632.50 L812.50 632.50 L928.00 632.50 L930.50 632.50 L930.50 627.50 L812.50 627.50 L812.50 556.38 L871.62 556.38 L874.38 556.38 L923.00 556.38 L924.38 556.38 L924.38 553.62 L874.38 553.62 L874.38 456.38 L921.62 456.38 L921.62 525.00 L921.62 526.38 L924.38 526.38 L924.38 456.38 L924.38 453.62 L924.38 427.50 L1009.50 427.50 L1009.50 627.50 L1004.00 627.50 L1001.50 627.50 L1001.50 632.50 L1009.50 632.50 L1010.62 632.50 L1010.62 684.62 L1010.62 687.38 L1010.62 813.62 L1010.62 815.00 L1010.62 816.38 L1013.38 816.38 L1125.50 816.38 L1125.50 875.62 L1009.38 875.62 L1006.62 875.62 L883.38 875.62 L880.62 875.62 L750.38 875.62 L747.62 875.62 L498.38 875.62 L495.62 875.62 L241.38 875.62 L241.38 873.00 L241.38 871.62 L238.62 871.62 L238.62 875.62 L238.62 878.38 L238.62 1015.50 L39.50 1015.50 L39.50 816.38 L238.62 816.38 L238.62 819.00 L238.62 820.38 L241.38 820.38 L241.38 816.38 L322.62 816.38 L324.00 816.38 L325.38 816.38 L325.38 813.62 L325.38 645.00 L325.38 643.62 L322.62 643.62 L322.62 813.62 L241.38 813.62 L238.62 813.62 L39.50 813.62 L39.50 621.38 L173.62 621.38 L176.38 621.38 L239.62 621.38 L239.62 775.00 L239.62 776.38 L242.38 776.38 L242.38 621.38 L260.62 621.38 L262.00 621.38 L263.38 621.38 L263.38 618.62 L263.38 516.38 L327.00 516.38 L328.38 516.38 L328.38 513.62 L263.38 513.62 L260.62 513.62 L176.38 513.62 L175.00 513.62 L173.62 513.62 L173.62 516.38 L173.62 580.38 L39.50 580.38 L39.50 516.38 L120.62 516.38 L122.00 516.38 L123.38 516.38 L123.38 513.62 L123.38 431.38 L194.62 431.38 L196.00 431.38 L197.38 431.38 L197.38 428.62 L197.38 238.38 L236.62 238.38 L239.38 238.38 L430.62 238.38Z M1010.38 235.62 L1010.38 36.50 L1125.50 36.50 L1125.50 235.62 L1010.38 235.62Z M818.38 235.62 L818.38 36.50 L1007.62 36.50 L1007.62 235.62 L818.38 235.62Z M197.38 235.62 L194.62 235.62 L39.50 235.62 L39.50 36.50 L236.62 36.50 L236.62 235.62 L197.38 235.62Z M430.62 36.50 L430.62 235.62 L239.38 235.62 L239.38 36.50 L430.62 36.50Z M622.62 36.50 L622.62 235.62 L433.38 235.62 L433.38 36.50 L622.62 36.50Z M123.38 428.62 L122.00 428.62 L120.62 428.62 L120.62 431.38 L120.62 513.62 L39.50 513.62 L39.50 238.38 L194.62 238.38 L194.62 428.62 L123.38 428.62Z M176.38 516.38 L260.62 516.38 L260.62 580.38 L176.38 580.38 L176.38 516.38Z M39.50 618.62 L39.50 581.62 L173.62 581.62 L173.62 618.62 L39.50 618.62Z M239.62 618.62 L176.38 618.62 L176.38 581.62 L260.62 581.62 L260.62 618.62 L242.38 618.62 L239.62 618.62Z M625.38 235.62 L625.38 36.50 L815.62 36.50 L815.62 235.62 L625.38 235.62Z M241.38 878.38 L495.62 878.38 L495.62 1015.50 L241.38 1015.50 L241.38 878.38Z M871.62 456.38 L871.62 553.62 L812.50 553.62 L812.50 456.38 L871.62 456.38Z M874.38 453.62 L871.62 453.62 L812.50 453.62 L812.50 427.50 L921.62 427.50 L921.62 453.62 L874.38 453.62Z M1009.38 878.38 L1125.50 878.38 L1125.50 1015.50 L1009.38 1015.50 L1009.38 878.38Z M883.38 878.38 L1006.62 878.38 L1006.62 1015.50 L883.38 1015.50 L883.38 878.38Z M750.38 878.38 L880.62 878.38 L880.62 1015.50 L750.38 1015.50 L750.38 878.38Z M498.38 1015.50 L498.38 878.38 L747.62 878.38 L747.62 1015.50 L498.38 1015.50Z M1014.50 431.38 L1125.50 431.38 L1125.50 684.62 L1013.38 684.62 L1013.38 632.50 L1014.50 632.50 L1014.50 627.50 L1014.50 431.38Z M1013.38 687.38 L1125.50 687.38 L1125.50 813.62 L1013.38 813.62 L1013.38 687.38Z M369.62 563.62 L369.62 566.38 L369.62 628.62 L369.62 630.00 L369.62 631.38 L372.38 631.38 L518.62 631.38 L520.00 631.38 L521.38 631.38 L521.38 628.62 L521.38 609.38 L736.62 609.38 L738.00 609.38 L739.38 609.38 L739.38 606.62 L739.38 398.00 L739.38 396.62 L736.62 396.62 L736.62 397.38 L372.38 397.38 L372.38 396.62 L369.62 396.62 L369.62 563.62Z M372.38 566.38 L518.62 566.38 L518.62 606.62 L518.62 609.38 L518.62 628.62 L372.38 628.62 L372.38 566.38Z M372.38 428.62 L518.62 428.62 L518.62 563.62 L372.38 563.62 L372.38 428.62Z M736.62 428.62 L736.62 606.62 L521.38 606.62 L521.38 566.38 L521.38 563.62 L521.38 428.62 L736.62 428.62Z M736.62 398.62 L736.62 427.38 L521.38 427.38 L521.38 426.62 L518.62 426.62 L518.62 427.38 L372.38 427.38 L372.38 398.62 L736.62 398.62Z M808.62 282.38 L808.62 385.62 L808.62 387.00 L808.62 388.38 L811.38 388.38 L949.62 388.38 L951.00 388.38 L952.38 388.38 L952.38 385.62 L952.38 282.38 L952.38 281.00 L952.38 279.62 L949.62 279.62 L811.38 279.62 L810.00 279.62 L808.62 279.62 L808.62 282.38Z M811.38 282.38 L949.62 282.38 L949.62 385.62 L811.38 385.62 L811.38 282.38Z"
        />

        {/* Room numbers, top-to-bottom in the final rendered orientation:
            01 Small conference, 02 Big conference, 03 Studio. Anchored
            near each room's final top-left corner — under this group's
            rotate(90), that corresponds to each room's pre-rotation
            bottom-left corner (x, y+h), inset by 22 units. Each is also
            counter-rotated -90° around its own anchor to cancel the
            parent <g>'s rotate(90) (same fix as the earlier label bug —
            otherwise these render sideways too). */}
        <g id="room-numbers">
          <text className="room-number" x={395} y={543} transform="rotate(-90 395 543)">01</text>
          <text className="room-number" x={542} y={588} transform="rotate(-90 542 588)">02</text>
          <text className="room-number" x={832} y={365} transform="rotate(-90 832 365)">03</text>
        </g>
      </g>
    </svg>
  );
}
