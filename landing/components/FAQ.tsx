import SectionHeading from "./ui/SectionHeading";

/* Plain-text Q&A that mirrors what students actually search. The answers are
 * written to stand alone (each starts with the subject) so AI answer engines
 * and search snippets can lift them verbatim. Rendered with native <details>
 * so every answer stays in the HTML source for crawlers, and duplicated into
 * FAQPage structured data below. */
const faqs: { q: string; a: string }[] = [
  {
    q: "Where can I find BRAC University CSE previous questions?",
    a: "You can find BRAC University CSE previous questions on BRACU Vault, a free student-run archive at bracuvault.me. It collects past quiz, midterm and final exam questions along with lecture notes, slides, lab solutions and projects for 39 CSE courses, organized by course code so you can go straight to the one you need.",
  },
  {
    q: "Is BRACU Vault free to use?",
    a: "Yes. BRACU Vault is completely free for BRAC University students. You can browse and download notes, slides, past questions, lab solutions and projects with no payment, subscription or account required for reading.",
  },
  {
    q: "What can I find on BRACU Vault?",
    a: "BRACU Vault has over 13,000 curated files across 39 BRAC University CSE courses: lecture notes, class slides, previous exam questions (quiz, midterm and final), assignment and lab solutions, and full projects. Files are grouped by course and by folder such as Theory and Lab, so material is easy to find.",
  },
  {
    q: "Which BRAC University CSE courses are covered?",
    a: "BRACU Vault covers 39 courses across the BRAC University Computer Science curriculum, including core courses such as CSE110, CSE111, CSE220, CSE260, CSE321, CSE330, CSE331, CSE340, CSE370, CSE420, CSE421, CSE422 and CSE470, plus electives, mathematics and general-education courses.",
  },
  {
    q: "How do I find notes for a specific course like CSE220 or CSE370?",
    a: "Open the course from the Orbit page, or search by course code. Each course has its own page, for example bracuvault.me/course/CSE220, where files are sorted into folders like Theory and Lab with notes, slides, past questions and solutions in each. You can also press Ctrl+K anywhere on the site to search every file at once.",
  },
  {
    q: "Can I upload my own notes or past questions?",
    a: "Yes. Any verified BRAC University student can contribute. Sign in with your @g.bracu.ac.bd university email, open a course folder, and use the Upload button. Uploads are reviewed by a moderator before they go live, so the archive stays clean and relevant.",
  },
  {
    q: "Is BRACU Vault an official BRAC University website?",
    a: "No. BRACU Vault is an independent, student-run project. It is not affiliated with, endorsed by, or operated by BRAC University. It exists to help students share and find study materials more easily.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-24 py-24 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title={
            <>
              Questions, <span className="text-gradient">answered</span>
            </>
          }
        />

        <div className="mt-12 grid gap-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl glass px-6 py-5 transition-shadow open:shadow-glow [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-fg">
                {f.q}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 flex-shrink-0 text-fg/40 transition-transform duration-300 group-open:rotate-180"
                  fill="none"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg/60">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
