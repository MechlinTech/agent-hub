import type { LegalSection } from "../content/privacy";

export type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, lastUpdated, intro, sections }: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-indigo-800/55">Last updated: {lastUpdated}</p>
        <p className="mt-6 text-base leading-relaxed text-indigo-900/80">{intro}</p>
      </header>
      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-indigo-950">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-indigo-900/75">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
