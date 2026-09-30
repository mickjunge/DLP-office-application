import { useNavigate } from "react-router-dom";

// Traced from the real floor plan (1504-PLG-DAVID LEWIS-ELECTRAPLAN.pdf) —
// coordinates were measured proportionally off a high-res render of the
// drawing (wall positions read as fractions of the building's overall
// footprint), not eyeballed/guessed. Electrical symbols, furniture detail,
// and exact wall thickness are dropped since this is a simplification, but
// room position/size relative to the building is accurate.
const BOOKABLE_ROOMS = [
  { slug: "studio", name: "Studio", x: 772, y: 256, w: 142, h: 109 },
  { slug: "small-conference-room", name: "Small conference room", x: 342, y: 377, w: 154, h: 205 },
  { slug: "big-conference-room", name: "Big conference room", x: 525, y: 377, w: 192, h: 205 },
] as const;

const CONTEXT_AREAS = [
  { name: "Desks", x: 10, y: 10, w: 1200, h: 209 },
  { name: "Office", x: 10, y: 219, w: 165, h: 188 },
  { name: "Kitchen", x: 175, y: 219, w: 75, h: 267 },
  { name: "Lunch / meeting table", x: 254, y: 219, w: 451, h: 158 },
  { name: "Ping Pong", x: 964, y: 281, w: 87, h: 63 },
  { name: "Reception & toilets", x: 10, y: 407, w: 294, h: 204 },
  { name: "Storage", x: 342, y: 582, w: 154, h: 29 },
  { name: "Elevator & stairs", x: 755, y: 377, w: 225, h: 234 },
  { name: "Kitchen / lounge", x: 10, y: 611, w: 1200, h: 228 },
  { name: "Desks", x: 10, y: 839, w: 1200, h: 151 },
] as const;

export default function FloorPlan() {
  const navigate = useNavigate();

  return (
    <svg viewBox="0 0 1220 1000" className="w-full h-auto select-none">
      {/* Building outline */}
      <rect x={8} y={8} width={1204} height={984} rx={6} fill="#ffffff" stroke="#d1d5db" strokeWidth={2} />

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
