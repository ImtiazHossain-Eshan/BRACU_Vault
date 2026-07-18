import { categories } from "@/lib/data";
import Logo from "./brand/Logo";

const columns = [
  {
    title: "Curriculum",
    links: categories.map((c) => ({ label: c.label, href: "#curriculum" })),
  },
  {
    title: "Explore",
    links: [
      { label: "Orbit", href: "/orbit" },
      { label: "Featured Projects", href: "#projects" },
      { label: "How it works", href: "#flow" },
      { label: "FAQ", href: "#faq" },
      { label: "Brand", href: "/brand" },
      { label: "Enter the Vault", href: "#cta" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-fg/10 py-14">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Logo href="#top" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg/45">
              An independent, student-run academic archive for BRAC University CSE:
              13,000+ files, 39 courses, organized the way your degree flows.
            </p>

            <div className="mt-6">
              <p className="text-sm text-fg/60">
                Created by <span className="font-medium text-fg">Imtiaz Hossain</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href="https://github.com/ImtiazHossain-Eshan"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="grid h-9 w-9 place-items-center rounded-full glass text-fg/60 transition-colors hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.48A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/imtiazhossaineshan/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="grid h-9 w-9 place-items-center rounded-full glass text-fg/60 transition-colors hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 10.9 21 13.7V21h-4v-6.5c0-1.55-.03-3.55-2.17-3.55-2.17 0-2.5 1.7-2.5 3.44V21H9z" />
                  </svg>
                </a>
                <a
                  href="mailto:imtiaz.hossain.eshan@gmail.com"
                  aria-label="Email"
                  className="grid h-9 w-9 place-items-center rounded-full glass text-fg/60 transition-colors hover:text-fg"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-fg/70">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-fg/50 transition-colors hover:text-fg"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 rounded-xl border border-fg/10 bg-fg/[0.02] px-4 py-3 text-center text-xs leading-relaxed text-fg/45">
          BRACU Vault is an <span className="font-medium text-fg/70">unofficial, student-run</span> project.
          It is not affiliated with, endorsed by, or operated by BRAC University. All course materials
          belong to their respective authors and are shared by students for educational use.
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-fg/10 pt-6 text-xs text-fg/40 sm:flex-row">
          <span>© {new Date().getFullYear()} BRACU Vault · Built by Imtiaz Hossain</span>
          <span>Notes · Slides · Labs · Past Exams · Projects</span>
        </div>
      </div>
    </footer>
  );
}
