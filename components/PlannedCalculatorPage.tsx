import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import {
  getCategoryBySlug,
  getRelatedCalculators,
  type Calculator,
} from "@/lib/calculators/registry";

export function PlannedCalculatorPage({ calculator }: { calculator: Calculator }) {
  const category = getCategoryBySlug(calculator.category);
  const related = getRelatedCalculators(calculator.slug);

  return (
    <>
      <Breadcrumbs
        items={[...(category ? [{ label: category.title }] : []), { label: calculator.shortTitle }]}
      />
      <article className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{calculator.title}</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Этот калькулятор в разработке и скоро появится на сайте. {calculator.description}
        </p>
        <RelatedCalculators calculators={related} />
      </article>
    </>
  );
}
