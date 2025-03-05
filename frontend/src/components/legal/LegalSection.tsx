'use client';

interface LegalSectionProps {
  title: string;
  content: string;
}

export function LegalSection({ title, content }: LegalSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 whitespace-pre-line">
        {content}
      </div>
    </section>
  );
} 