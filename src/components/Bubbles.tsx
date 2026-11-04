import { cn } from "@/lib/utils";

/** Fixed layout so the bubbles look hand-placed and never jump between renders. */
const BUBBLES = [
  { l: 6, t: 72, s: 10, d: 14, delay: 0 },
  { l: 14, t: 30, s: 6, d: 11, delay: 3 },
  { l: 22, t: 86, s: 16, d: 17, delay: 6 },
  { l: 31, t: 55, s: 8, d: 13, delay: 1.5 },
  { l: 40, t: 18, s: 5, d: 10, delay: 4.5 },
  { l: 47, t: 78, s: 12, d: 16, delay: 8 },
  { l: 55, t: 40, s: 7, d: 12, delay: 2 },
  { l: 62, t: 88, s: 20, d: 19, delay: 5 },
  { l: 69, t: 22, s: 9, d: 14, delay: 9 },
  { l: 76, t: 64, s: 6, d: 11, delay: 0.8 },
  { l: 83, t: 35, s: 14, d: 18, delay: 3.6 },
  { l: 90, t: 80, s: 8, d: 13, delay: 7 },
  { l: 95, t: 15, s: 11, d: 15, delay: 10 },
  { l: 36, t: 92, s: 9, d: 15, delay: 11 },
  { l: 58, t: 8, s: 4, d: 9, delay: 6.5 },
  { l: 86, t: 55, s: 5, d: 10, delay: 12 },
];

/** Soft floating bubbles ("gotas") for green surfaces. Respects reduced motion. */
export function Bubbles({ className, count = BUBBLES.length }: { className?: string; count?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {BUBBLES.slice(0, count).map((b, i) => (
        <span
          key={i}
          className="absolute animate-bubble rounded-full motion-reduce:animate-none"
          style={{
            left: `${b.l}%`,
            top: `${b.t}%`,
            width: b.s,
            height: b.s,
            animationDuration: `${b.d}s`,
            animationDelay: `-${b.delay}s`,
            background: "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.04) 72%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </div>
  );
}
