import { useEffect, useState } from "react";
import { useAnimatedViewBox, type ViewBox } from "@/hooks/useAnimatedViewBox";

const FULL_BUILDING: ViewBox = [-1040.5, 14.5, 1029, 1136];
// Tight on the two bookable rooms (their wall block spans x -631..-396, y 369..739
// in this rotated space) with a margin, so they fill the right-hand side.
const OVERVIEW: ViewBox = [-683, 329, 340, 450];
const ROOM_ZOOM: Record<string, ViewBox> = {
  "small-conference-room": [-630, 308, 266, 277],
  "big-conference-room": [-675, 455, 315, 348],
  studio: [-452, 745, 236, 271],
};

// Intro: show the whole office block for a beat, then glide into the rooms.
const INTRO_HOLD_MS = 0;
const INTRO_ZOOM_MS = 1600;

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
  const [introSettled, setIntroSettled] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setIntroDone(true), INTRO_HOLD_MS);
    const t2 = setTimeout(() => setIntroSettled(true), INTRO_HOLD_MS + INTRO_ZOOM_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  const target = !introDone ? FULL_BUILDING : zoomTo === "overview" ? OVERVIEW : ROOM_ZOOM[zoomTo];
  // The first zoom (whole building -> meeting rooms) is slower so it reads as
  // an intro; every later move (room to room, back to overview) uses 900ms.
  const viewBox = useAnimatedViewBox(target, FULL_BUILDING, introSettled ? 900 : INTRO_ZOOM_MS);
  // Overview: every room shows its live status. Zoomed into a specific
  // room: only that room keeps its status color — the other two go
  // plain white (not the neutral blue tint) until back on the overview,
  // so nothing but the selected room draws the eye.
  const roomClass = (slug: RoomSlug) => {
    if (zoomTo === "overview") return busySlugs?.has(slug) ? "status-busy" : "status-available";
    if (zoomTo === slug) return busySlugs?.has(slug) ? "status-busy" : "status-available";
    return "status-hidden";
  };

  return (
    // Fills the entire viewport (w-full h-full, absolute inset-0). Uses
    // preserveAspectRatio="meet" (the default) rather than "slice": slice
    // crops whichever axis overflows to guarantee full coverage, which
    // for this portrait-shaped room crop inside a landscape browser
    // window cropped away Studio almost entirely. Meet always shows the
    // complete viewBox, letterboxing only the shorter axis — and since
    // that letterbox is plain black against the black page, it's invisible
    // rather than looking like a visible box.
    <svg
      viewBox={viewBox.join(" ")}
      preserveAspectRatio="xMaxYMid meet"
      className="absolute inset-0 w-full h-full select-none"
      // Content outside the animated viewBox still draws in the letterbox,
      // so neighbouring walls would show up behind the left-hand panel;
      // fade the map out toward the left edge instead of hard-clipping it.
      style={{
        WebkitMaskImage: "linear-gradient(to right, transparent 36%, #000 44%)",
        maskImage: "linear-gradient(to right, transparent 36%, #000 44%)",
      }}
    >
      <style>{`
        .status-hidden { fill: rgba(0,2,4,.55); cursor: pointer; transition: fill .2s ease; }
        .status-hidden:hover { fill: rgba(255,255,255,.08); }
        .status-available { fill: #16803c; cursor: pointer; transition: fill .2s ease; }
        .status-available:hover { fill: #1d9a4a; }
        .status-busy { fill: #b91c1c; cursor: pointer; transition: fill .2s ease; }
        .status-busy:hover { fill: #d62828; }
        .status-disabled { fill: rgba(0,2,4,.55); }
        .room-number { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; fill: #ffffff; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
      `}</style>
            <g transform="rotate(90)">
        
        <g id="rooms">
          <rect x={37} y={34} width={1091} height={203} fill="rgba(0,2,4,.55)" />
          <rect x={37} y={237} width={159} height={193} fill="rgba(0,2,4,.55)" />
          <rect x={37} y={515} width={138} height={105} fill="rgba(0,2,4,.55)" />
          <rect x={175} y={515} width={87} height={105} fill="rgba(0,2,4,.55)" />
          <rect x={37} y={620} width={206} height={195} fill="rgba(0,2,4,.55)" />
          <rect x={373} y={565} width={147} height={65} fill="rgba(0,2,4,.55)" />
          <rect x={810} y={425} width={202} height={205} fill="rgba(0,2,4,.55)" />
          <rect x={1012} y={430} width={116} height={256} fill="rgba(0,2,4,.55)" />
          <rect x={1012} y={686} width={116} height={129} fill="rgba(0,2,4,.55)" />
          <rect x={370} y={666} width={569} height={135} fill="rgba(0,2,4,.55)" />
          <rect x={37} y={815} width={203} height={203} fill="rgba(0,2,4,.55)" />
          <rect x={240} y={877} width={257} height={141} fill="rgba(0,2,4,.55)" />
          <rect x={497} y={877} width={252} height={141} fill="rgba(0,2,4,.55)" />
          <rect x={749} y={877} width={133} height={141} fill="rgba(0,2,4,.55)" />
          <rect x={882} y={877} width={126} height={141} fill="rgba(0,2,4,.55)" />
          <rect x={1008} y={877} width={120} height={141} fill="rgba(0,2,4,.55)" />

          {/* Bookable rooms — coordinates are the exact inner wall cavity
              for each room, read directly off the walls path's own
              subpaths below (same source geometry, not a separate guess),
              so the fill is flush with the real wall faces on every edge
              instead of a uniform inset that happened to line up on some
              edges and leave a gap on others. Sharp corners (no rx) to
              match the real architecture — see the earlier fix for why a
              rounded fill read as wrong here. */}
          {/* Studio (room 03) is switched off for now: plain floor, no number, not clickable. */}
          <rect x={811.38} y={282.38} width={138.24} height={103.24} className="status-disabled" />
          <rect x={372.38} y={428.62} width={146.24} height={135} className={roomClass("small-conference-room")} onClick={() => onSelectRoom?.("small-conference-room")} />
          <rect x={521.38} y={428.62} width={215.24} height={178} className={roomClass("big-conference-room")} onClick={() => onSelectRoom?.("big-conference-room")} />
        </g>

        {/* Only the furniture inside the two bookable conference rooms is
            kept (it signals room character — round vs. long table); all
            other architectural detail (desk clusters, toilet fixtures,
            elevator/stair hatching, kitchen counters) was removed as
            visual noise that made this read as a technical drawing
            instead of a booking-app map. */}
        {/* pointer-events none: hovering/clicking a table or chair falls through to the room fill underneath, so it counts as part of the room. */}
        <g id="furniture" pointerEvents="none">
          <circle cx={447} cy={493} r={31} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <rect x={573} y={497} width={132} height={41} rx={3} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />

          {/* Chairs — 6 around the round table (matches capacity 6),
              6 per long side of the rectangular table (12 total, matches
              capacity 12). Positions computed from the table geometry
              above, not eyeballed. */}
          <circle cx={447} cy={452} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={482.5} cy={472.5} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={482.5} cy={513.5} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={447} cy={534} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={411.5} cy={513.5} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={411.5} cy={472.5} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />

          <circle cx={584} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={606} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={628} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={650} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={672} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={694} cy={486} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={584} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={606} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={628} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={650} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={672} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
          <circle cx={694} cy={549} r={6} fill="#000204" stroke="#8a9096" strokeWidth={0.8} />
        </g>

        <g id="walls" fill="none" stroke="#d9d9d9" strokeWidth={2.76} strokeLinecap="square">
          <path d="M37 34 H1128 M37 237 H1128 M122 430 H196 M810 455 H923 M37 515 H122 M175 515 H327 M810 555 H923 M37 581 H262 M37 620 H262 M37 815 H324 M240 877 H1128 M37 1018 H1128 M810 281 H951 M810 387 H951 M810 425 H1012 M1012 430 H1128 M810 630 H929.12 M1002.88 630 H1012 M1012 686 H1128 M1012 815 H1128 M238 34 V237 M196 237 V430 M122 430 V515 M37 34 V1018 M175 515 V620 M262 515 V620 M241 620 V775 M240 873 V1018 M432 34 V237 M624 34 V237 M817 34 V237 M810 281 V387 M873 455 V555 M810 425 V630 M324 645 V815 M497 877 V1018 M749 877 V1018 M882 877 V1018 M1009 34 V237 M951 281 V387 M923 425 V525 M1128 34 V1018 M1012 425 V815 M1008 877 V1018" />
        </g>


        {/* Walls around rooms 01/02, drawn as constant-width strokes instead of
            the hand-traced outline (which varied from ~1.2 to ~2.8 thick).
            Centerlines sit exactly half a wall (1.38) outside the room
            fills' edges, so fills stay flush with the wall faces. */}
        <g id="room-walls" fill="none" stroke="#d9d9d9" strokeWidth={2.76} strokeLinejoin="miter">
          <path d="M371 398 H738 V608 H520 V630 H371 Z" />
          <path d="M371 427.24 H738 M371 565 H520 M520 427.24 V608" />
        </g>

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
        </g>
      </g>
    </svg>
  );
}
