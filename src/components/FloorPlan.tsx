import { useNavigate } from "react-router-dom";

// Simplified trace of the office floor plan (1504-PLG-DAVID LEWIS-ELECTRAPLAN),
// laid out as two open desk bands (top/bottom) sandwiching two middle bands.
// Coordinates are hand-placed to match room ordering on the real plan, not
// measured wall-for-wall — this is a simplification, not a scale drawing.
const BOOKABLE_ROOMS = [
  { slug: "studio", name: "Studio", x: 560, y: 130, w: 260, h: 190 },
  { slug: "small-conference-room", name: "Small conference room", x: 220, y: 320, w: 180, h: 160 },
  { slug: "big-conference-room", name: "Big conference room", x: 500, y: 320, w: 280, h: 160 },
] as const;

const CONTEXT_AREAS = [
  { name: "Desks", x: 20, y: 20, w: 1160, h: 110 },
  { name: "Kitchen / lounge", x: 20, y: 130, w: 200, h: 190 },
  { name: "Lunch / meeting table", x: 220, y: 130, w: 340, h: 190 },
  { name: "Ping Pong", x: 820, y: 130, w: 120, h: 190 },
  { name: "Reception & toilets", x: 20, y: 320, w: 200, h: 160 },
  { name: "Storage", x: 400, y: 320, w: 100, h: 160 },
  { name: "Elevator & stairs", x: 780, y: 320, w: 200, h: 160 },
  { name: "Desks", x: 20, y: 500, w: 960, h: 140 },
] as const;

export default function FloorPlan() {
  const navigate = useNavigate();

  return (
    <svg viewBox="0 0 1200 660" className="w-full h-auto select-none">
      {/* Building outline */}
      <rect x={10} y={10} width={1180} height={640} rx={6} fill="#ffffff" stroke="#d1d5db" strokeWidth={2} />

      {CONTEXT_AREAS.map((area, i) => (
        <g key={i}>
          <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth={1} rx={4} />
          <text
            x={area.x + area.w / 2}
            y={area.y + area.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-400 text-[13px] font-medium"
          >
            {area.name}
          </text>
        </g>
      ))}

      {BOOKABLE_ROOMS.map(room => (
        <g
          key={room.slug}
          onClick={() => navigate(`/rooms/${room.slug}`)}
          className="cursor-pointer group"
        >
          <rect
            x={room.x}
            y={room.y}
            width={room.w}
            height={room.h}
            rx={4}
            className="fill-white stroke-gray-300 group-hover:fill-blue-50 group-hover:stroke-blue-400 transition-colors"
            strokeWidth={2}
          />
          <text
            x={room.x + room.w / 2}
            y={room.y + room.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-800 text-[15px] font-semibold group-hover:fill-blue-700 transition-colors"
          >
            {room.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
