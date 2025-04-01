'use client';

interface LegalSectionProps {
  title: string;
  content: string;
}

export function LegalSection({ title, content }: LegalSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
        {content}
      </div>
    </section>
  );
} 