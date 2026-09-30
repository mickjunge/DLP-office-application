import { useNavigate } from "react-router-dom";

// Traced 1:1 from the real floor plan by hand in Illustrator (source:
// /Users/mickjunge/Documents/mockups DLP digital poster/floorplan_slick.svg),
// not measured/approximated like the earlier version. Only three rooms are
// bookable — everything else is static line art for context.
export default function FloorPlan() {
  const navigate = useNavigate();

  return (
    // Zoomed toward the three bookable rooms — the full building geometry
    // below is untouched/complete, this viewBox just windows into a
    // region of it, so parts of the building intentionally render outside
    // the visible page (clipped by the page's own overflow-hidden).
    <svg viewBox="-730 253 569 818" className="h-full w-auto select-none">
      <style>{`
        .bookable { cursor: pointer; transition: fill .2s ease; }
        .bookable:hover { fill: #eff6ff; }
      `}</style>
      <rect x={-1066} y={-11} width={1080} height={1187} fill="#fff" />
      <g transform="rotate(90)">
        <rect x={37} y={34} width={1091} height={984} fill="#fff" />

        <g id="rooms">
          <rect x={37} y={34} width={1091} height={203} fill="#FFFFFF" />
          <rect x={37} y={237} width={159} height={193} fill="#FFFFFF" />
          <rect x={37} y={515} width={138} height={105} fill="#FFFFFF" />
          <rect x={175} y={515} width={87} height={105} fill="#FFFFFF" />
          <rect x={37} y={620} width={206} height={195} fill="#FFFFFF" />
          <rect x={373} y={565} width={147} height={65} fill="#FFFFFF" />
          <rect x={810} y={425} width={202} height={205} fill="#FFFFFF" />
          <rect x={1012} y={430} width={116} height={256} fill="#FFFFFF" />
          <rect x={1012} y={686} width={116} height={129} fill="#FFFFFF" />
          <rect x={370} y={666} width={569} height={135} fill="#FFFFFF" />
          <rect x={37} y={815} width={203} height={203} fill="#FFFFFF" />
          <rect x={240} y={877} width={257} height={141} fill="#FFFFFF" />
          <rect x={497} y={877} width={252} height={141} fill="#FFFFFF" />
          <rect x={749} y={877} width={133} height={141} fill="#FFFFFF" />
          <rect x={882} y={877} width={126} height={141} fill="#FFFFFF" />
          <rect x={1008} y={877} width={120} height={141} fill="#FFFFFF" />

          {/* Bookable rooms */}
          <rect x={810} y={281} width={141} height={106} fill="#FFFFFF" className="bookable" onClick={() => navigate("/rooms/studio")} />
          <rect x={373} y={429} width={147} height={136} fill="#FFFFFF" className="bookable" onClick={() => navigate("/rooms/small-conference-room")} />
          <rect x={520} y={425} width={218} height={185} fill="#FFFFFF" className="bookable" onClick={() => navigate("/rooms/big-conference-room")} />
        </g>

        <g id="furniture">
          <rect x={80} y={106} width={317} height={61} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <line x1={80} y1={136.5} x2={397} y2={136.5} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={132.83333333333334} y1={106} x2={132.83333333333334} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={185.66666666666669} y1={106} x2={185.66666666666669} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={238.5} y1={106} x2={238.5} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={291.33333333333337} y1={106} x2={291.33333333333337} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={344.1666666666667} y1={106} x2={344.1666666666667} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={466} y={106} width={317} height={61} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <line x1={466} y1={136.5} x2={783} y2={136.5} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={518.8333333333334} y1={106} x2={518.8333333333334} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={571.6666666666666} y1={106} x2={571.6666666666666} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={624.5} y1={106} x2={624.5} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={677.3333333333334} y1={106} x2={677.3333333333334} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={730.1666666666667} y1={106} x2={730.1666666666667} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={852} y={106} width={211} height={61} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <line x1={852} y1={136.5} x2={1063} y2={136.5} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={904.75} y1={106} x2={904.75} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={957.5} y1={106} x2={957.5} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={1010.25} y1={106} x2={1010.25} y2={167} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={50} y={298} width={107} height={60} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={213} y={281} width={63} height={107} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={371} y={307} width={367} height={53} rx={6} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={1000} y={310} width={80} height={45} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={40} y={438} width={20} height={54} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={62} y={494} width={56} height={19} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={264} y={530} width={62} height={48} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={522} y={401} width={22} height={22} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={579} y={401} width={22} height={22} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={637} y={401} width={22} height={22} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={694} y={401} width={22} height={22} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <circle cx={447} cy={493} r={31} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={573} y={497} width={132} height={41} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={378} y={568} width={138} height={36} rx={2} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={1036} y={480} width={59} height={59} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={1036} y={582} width={59} height={60} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={1036} y={719} width={59} height={59} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={378} y={672} width={55} height={22} rx={5} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={438} y={672} width={55} height={22} rx={5} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={378} y={772} width={55} height={22} rx={5} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={438} y={772} width={55} height={22} rx={5} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={377} y={700} width={22} height={64} rx={5} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={440} y={716} width={40} height={22} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={562} y={690} width={35} height={89} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={663} y={716} width={140} height={36} rx={4} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={852} y={670} width={86} height={130} rx={4} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={870} y={800} width={60} height={24} fill="#fff" stroke="#111111" strokeWidth={0.8} />
          <line x1={870} y1={804.8} x2={930} y2={804.8} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={870} y1={809.6} x2={930} y2={809.6} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={870} y1={814.4} x2={930} y2={814.4} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={870} y1={819.2} x2={930} y2={819.2} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={66} y={905} width={30} height={74} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={144} y={916} width={88} height={36} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={286} y={919} width={117} height={33} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={439} y={919} width={119} height={33} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={608} y={919} width={119} height={33} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={818} y={919} width={130} height={33} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={1050} y={919} width={65} height={33} rx={3} fill="#FFFFFF" stroke="#111111" strokeWidth={0.8} />
          <rect x={47} y={685} width={43} height={57} fill="none" stroke="#111111" strokeWidth={0.8} />
          <line x1={47} y1={685} x2={90} y2={742} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={90} y1={685} x2={47} y2={742} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={96} y={685} width={44} height={57} fill="none" stroke="#111111" strokeWidth={0.8} />
          <line x1={96} y1={685} x2={140} y2={742} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={140} y1={685} x2={96} y2={742} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={146} y={640} width={92} height={108} fill="#fff" stroke="#111111" strokeWidth={0.8} />
          <line x1={146} y1={652.0} x2={238} y2={652.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={664.0} x2={238} y2={664.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={676.0} x2={238} y2={676.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={688.0} x2={238} y2={688.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={700.0} x2={238} y2={700.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={712.0} x2={238} y2={712.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={724.0} x2={238} y2={724.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={146} y1={736.0} x2={238} y2={736.0} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={818} y={562} width={104} height={62} fill="none" stroke="#111111" strokeWidth={0.8} />
          <line x1={818} y1={562} x2={922} y2={624} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={922} y1={562} x2={818} y2={624} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <rect x={930} y={458} width={74} height={87} fill="#fff" stroke="#111111" strokeWidth={0.8} />
          <line x1={930} y1={468.875} x2={1004} y2={468.875} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={479.75} x2={1004} y2={479.75} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={490.625} x2={1004} y2={490.625} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={501.5} x2={1004} y2={501.5} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={512.375} x2={1004} y2={512.375} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={523.25} x2={1004} y2={523.25} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
          <line x1={930} y1={534.125} x2={1004} y2={534.125} stroke="#111111" strokeWidth={0.6} strokeLinecap="square" />
        </g>

        <path
          fill="#000000"
          fillRule="evenodd"
          d="M1130.50 34.00 L1130.50 31.50 L1125.50 31.50 L39.50 31.50 L37.00 31.50 L34.50 31.50 L34.50 36.50 L34.50 1015.50 L34.50 1018.00 L34.50 1020.50 L39.50 1020.50 L1125.50 1020.50 L1128.00 1020.50 L1130.50 1020.50 L1130.50 1015.50 L1130.50 36.50 L1130.50 34.00Z M430.62 238.38 L433.38 238.38 L622.62 238.38 L625.38 238.38 L815.62 238.38 L818.38 238.38 L1007.62 238.38 L1010.38 238.38 L1125.50 238.38 L1125.50 428.62 L1014.50 428.62 L1014.50 427.50 L1014.50 425.00 L1014.50 422.50 L1009.50 422.50 L812.50 422.50 L810.00 422.50 L807.50 422.50 L807.50 427.50 L807.50 627.50 L807.50 630.00 L807.50 632.50 L812.50 632.50 L928.00 632.50 L930.50 632.50 L930.50 627.50 L812.50 627.50 L812.50 556.38 L871.62 556.38 L874.38 556.38 L923.00 556.38 L924.38 556.38 L924.38 553.62 L874.38 553.62 L874.38 456.38 L921.62 456.38 L921.62 525.00 L921.62 526.38 L924.38 526.38 L924.38 456.38 L924.38 453.62 L924.38 427.50 L1009.50 427.50 L1009.50 627.50 L1004.00 627.50 L1001.50 627.50 L1001.50 632.50 L1009.50 632.50 L1010.62 632.50 L1010.62 684.62 L1010.62 687.38 L1010.62 813.62 L1010.62 815.00 L1010.62 816.38 L1013.38 816.38 L1125.50 816.38 L1125.50 875.62 L1009.38 875.62 L1006.62 875.62 L883.38 875.62 L880.62 875.62 L750.38 875.62 L747.62 875.62 L498.38 875.62 L495.62 875.62 L241.38 875.62 L241.38 873.00 L241.38 871.62 L238.62 871.62 L238.62 875.62 L238.62 878.38 L238.62 1015.50 L39.50 1015.50 L39.50 816.38 L238.62 816.38 L238.62 819.00 L238.62 820.38 L241.38 820.38 L241.38 816.38 L322.62 816.38 L324.00 816.38 L325.38 816.38 L325.38 813.62 L325.38 645.00 L325.38 643.62 L322.62 643.62 L322.62 813.62 L241.38 813.62 L238.62 813.62 L39.50 813.62 L39.50 621.38 L173.62 621.38 L176.38 621.38 L239.62 621.38 L239.62 775.00 L239.62 776.38 L242.38 776.38 L242.38 621.38 L260.62 621.38 L262.00 621.38 L263.38 621.38 L263.38 618.62 L263.38 516.38 L327.00 516.38 L328.38 516.38 L328.38 513.62 L263.38 513.62 L260.62 513.62 L176.38 513.62 L175.00 513.62 L173.62 513.62 L173.62 516.38 L173.62 580.38 L39.50 580.38 L39.50 516.38 L120.62 516.38 L122.00 516.38 L123.38 516.38 L123.38 513.62 L123.38 431.38 L194.62 431.38 L196.00 431.38 L197.38 431.38 L197.38 428.62 L197.38 238.38 L236.62 238.38 L239.38 238.38 L430.62 238.38Z M1010.38 235.62 L1010.38 36.50 L1125.50 36.50 L1125.50 235.62 L1010.38 235.62Z M818.38 235.62 L818.38 36.50 L1007.62 36.50 L1007.62 235.62 L818.38 235.62Z M197.38 235.62 L194.62 235.62 L39.50 235.62 L39.50 36.50 L236.62 36.50 L236.62 235.62 L197.38 235.62Z M430.62 36.50 L430.62 235.62 L239.38 235.62 L239.38 36.50 L430.62 36.50Z M622.62 36.50 L622.62 235.62 L433.38 235.62 L433.38 36.50 L622.62 36.50Z M123.38 428.62 L122.00 428.62 L120.62 428.62 L120.62 431.38 L120.62 513.62 L39.50 513.62 L39.50 238.38 L194.62 238.38 L194.62 428.62 L123.38 428.62Z M176.38 516.38 L260.62 516.38 L260.62 580.38 L176.38 580.38 L176.38 516.38Z M39.50 618.62 L39.50 581.62 L173.62 581.62 L173.62 618.62 L39.50 618.62Z M239.62 618.62 L176.38 618.62 L176.38 581.62 L260.62 581.62 L260.62 618.62 L242.38 618.62 L239.62 618.62Z M625.38 235.62 L625.38 36.50 L815.62 36.50 L815.62 235.62 L625.38 235.62Z M241.38 878.38 L495.62 878.38 L495.62 1015.50 L241.38 1015.50 L241.38 878.38Z M871.62 456.38 L871.62 553.62 L812.50 553.62 L812.50 456.38 L871.62 456.38Z M874.38 453.62 L871.62 453.62 L812.50 453.62 L812.50 427.50 L921.62 427.50 L921.62 453.62 L874.38 453.62Z M1009.38 878.38 L1125.50 878.38 L1125.50 1015.50 L1009.38 1015.50 L1009.38 878.38Z M883.38 878.38 L1006.62 878.38 L1006.62 1015.50 L883.38 1015.50 L883.38 878.38Z M750.38 878.38 L880.62 878.38 L880.62 1015.50 L750.38 1015.50 L750.38 878.38Z M498.38 1015.50 L498.38 878.38 L747.62 878.38 L747.62 1015.50 L498.38 1015.50Z M1014.50 431.38 L1125.50 431.38 L1125.50 684.62 L1013.38 684.62 L1013.38 632.50 L1014.50 632.50 L1014.50 627.50 L1014.50 431.38Z M1013.38 687.38 L1125.50 687.38 L1125.50 813.62 L1013.38 813.62 L1013.38 687.38Z M369.62 563.62 L369.62 566.38 L369.62 628.62 L369.62 630.00 L369.62 631.38 L372.38 631.38 L518.62 631.38 L520.00 631.38 L521.38 631.38 L521.38 628.62 L521.38 609.38 L736.62 609.38 L738.00 609.38 L739.38 609.38 L739.38 606.62 L739.38 398.00 L739.38 396.62 L736.62 396.62 L736.62 397.38 L372.38 397.38 L372.38 396.62 L369.62 396.62 L369.62 563.62Z M372.38 566.38 L518.62 566.38 L518.62 606.62 L518.62 609.38 L518.62 628.62 L372.38 628.62 L372.38 566.38Z M372.38 428.62 L518.62 428.62 L518.62 563.62 L372.38 563.62 L372.38 428.62Z M736.62 428.62 L736.62 606.62 L521.38 606.62 L521.38 566.38 L521.38 563.62 L521.38 428.62 L736.62 428.62Z M736.62 398.62 L736.62 427.38 L521.38 427.38 L521.38 426.62 L518.62 426.62 L518.62 427.38 L372.38 427.38 L372.38 398.62 L736.62 398.62Z M808.62 282.38 L808.62 385.62 L808.62 387.00 L808.62 388.38 L811.38 388.38 L949.62 388.38 L951.00 388.38 L952.38 388.38 L952.38 385.62 L952.38 282.38 L952.38 281.00 L952.38 279.62 L949.62 279.62 L811.38 279.62 L810.00 279.62 L808.62 279.62 L808.62 282.38Z M811.38 282.38 L949.62 282.38 L949.62 385.62 L811.38 385.62 L811.38 282.38Z"
        />

      </g>
    </svg>
  );
}
