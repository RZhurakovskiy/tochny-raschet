import Link from "next/link";
import type { Calculator } from "@/lib/calculators/registry";

export function RelatedCalculators({ calculators }: { calculators: Calculator[] }) {
  if (calculators.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-10">
      <h2 id="related-heading" className="mb-4 text-xl font-semibold">
        Похожие калькуляторы
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {calculators.map((calculator) => (
          <li key={calculator.slug}>
            <Link
              href={`/${calculator.slug}`}
              className="block h-full rounded-xl border border-border p-4 transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <span className="font-medium">{calculator.shortTitle}</span>
              <span className="mt-1 block text-sm text-muted">{calculator.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
