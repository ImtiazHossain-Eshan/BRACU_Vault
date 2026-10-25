/**
 * A slow diagonal light sweep that crosses a surface on hover - like a
 * reflection passing over glass/metal. Place inside a `group` container that
 * has `overflow-hidden`. Uses the `--sheen` token so it stays subtle in both
 * themes. Pure CSS transition, no JS.
 */
export default function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-y-12 -left-1/4 z-30 w-1/4 -skew-x-12 opacity-0 transition-all duration-[1100ms] ease-out group-hover:left-[130%] group-hover:opacity-100"
      style={{
        background:
          "linear-gradient(90deg, transparent, var(--sheen), transparent)",
      }}
    />
  );
}
