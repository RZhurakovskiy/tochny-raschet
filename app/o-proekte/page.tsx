import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "О проекте",
  description: `Кто и зачем делает калькуляторы на ${siteConfig.name}.`,
  path: "/o-proekte",
});

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "О проекте" }]} />
      <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-6 dark:prose-invert">
        <h1>О проекте</h1>
        <p>
          {siteConfig.name} - это набор бесплатных онлайн-калькуляторов для повседневных денежных и
          юридических задач: расчёт НДФЛ, отпускных, больничного, алиментов и других похожих
          ситуаций, с которыми сталкивается практически каждый.
        </p>
        <p>
          Мы не оказываем юридических или бухгалтерских услуг. Каждый калькулятор - это открытая
          реализация формулы из действующего законодательства (Налогового кодекса, Трудового
          кодекса, Семейного кодекса РФ и других нормативных актов), которую можно бесплатно
          использовать для прикидочного расчёта.
        </p>
        <p>
          Подробнее о том, как именно устроены расчёты и какие ограничения у них есть, - на странице{" "}
          <a href="/kak-schitaem">«Как мы считаем»</a>.
        </p>
      </article>
    </>
  );
}
