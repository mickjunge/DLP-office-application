import { useEffect, useRef, useState } from "react";

export type ViewBox = [number, number, number, number];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// Tweens an SVG viewBox between arbitrary targets — used instead of a
// fixed SMIL <animate> because the floorplan now has more than one
// possible zoom target (overview vs. a specific room), decided at
// runtime by which room is selected, not a single from/to pair known
// up front. Re-targeting mid-tween is handled correctly: the effect
// always starts the new tween from wherever the viewBox currently is,
// not from the previous target, so clicking a different room while
// one zoom is still animating doesn't jump/stutter.
export function useAnimatedViewBox(target: ViewBox, initial: ViewBox, durationMs = 900) {
  const [current, setCurrent] = useState<ViewBox>(initial);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = current;
    const to = target;
    let start: number | null = null;

    const step = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / durationMs, 1);
      const eased = easeOutCubic(progress);
      setCurrent([
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
        from[3] + (to[3] - from[3]) * eased,
      ]);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target[0], target[1], target[2], target[3], durationMs]);

  return current;
}
