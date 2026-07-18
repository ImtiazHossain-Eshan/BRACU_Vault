import { highlight } from "@/lib/search";

/** Renders text with the fuzzy-matched characters emphasised. */
export default function Highlight({
  text,
  query = "",
}: {
  text: string;
  query?: string;
}) {
  return (
    <>
      {highlight(text, query).map((p, i) =>
        p.match ? (
          <mark key={i} className="rounded bg-accent/20 px-0.5 text-accent">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}
