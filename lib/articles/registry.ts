/**
 * Метаданные статей раздела «Статьи» - структура заранее сделана так, чтобы её было легко
 * перенести в Prisma/PostgreSQL без изменения формы (см. prisma-schema.md), когда появится
 * админка. Пока - просто массив в коде, как и CALCULATORS в lib/calculators/registry.ts.
 * Сам текст статьи живёт отдельно, в components/articles/*.tsx -see getArticleContentComponent
 * в app/blog/[slug]/page.tsx.
 */

export type ArticleStatus = "draft" | "published";

export type Article = {
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  status: ArticleStatus;
  publishedAt: string;
  updatedAt: string;
  relatedCalculatorSlugs: string[];
  mainKeyword: string;
  secondaryKeywords: string[];
  sourceLabel: string;
  sourceUrl: string;
  dataUpdatedAt: string;
  author: string;
};

const DEFAULT_AUTHOR = "Роман Жураковский";

export const ARTICLES: Article[] = [
  {
    slug: "sokraschenie-shtata",
    title: "Сокращение штата: что вам положено и как всё посчитать",
    metaDescription:
      "Сокращение штата в 2026 году: сроки уведомления, какие выплаты положены и как посчитать компенсацию, выходное пособие и НДФЛ по шагам.",
    excerpt:
      "Пошаговый разбор: что должен сделать работодатель, какие выплаты положены и как их всё посчитать - со ссылками на калькуляторы для каждого шага.",
    status: "published",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    relatedCalculatorSlugs: ["vykhodnoe-posobie", "kompensaciya-otpuska", "ndfl"],
    mainKeyword: "что положено при сокращении штата",
    secondaryKeywords: [
      "выплаты при сокращении 2026",
      "уведомление о сокращении за сколько дней",
      "преимущественное право при сокращении",
    ],
    sourceLabel: "ст. 178-180 ТК РФ",
    sourceUrl:
      "https://www.consultant.ru/document/cons_doc_LAW_34683/0526867a7eace3f1f88798592ed0bdf3589f0528/",
    dataUpdatedAt: "2026-08-27",
    author: DEFAULT_AUTHOR,
  },
  {
    slug: "dekret-i-posobiya-na-rebenka",
    title: "Декрет и пособия на ребёнка: что и когда положено в 2026 году",
    metaDescription:
      "Хронология декрета в 2026 году: декретные выплаты, пособие по уходу за ребёнком до 1,5 лет и налоговый вычет - что и в какой момент оформлять.",
    excerpt:
      "От выхода в декрет до вычета на ребёнка - какие выплаты идут друг за другом, что нужно оформить и когда, со ссылками на калькуляторы для каждого этапа.",
    status: "published",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    relatedCalculatorSlugs: ["dekretnye", "detskie-vychety", "bolnichnyy-po-uhodu"],
    mainKeyword: "какие пособия положены при декрете",
    secondaryKeywords: [
      "пособие по уходу за ребенком до 1.5 лет 2026",
      "декретный отпуск сроки",
      "когда оформлять вычет на ребенка",
    ],
    sourceLabel: "закон № 255-ФЗ, ст. 218 НК РФ",
    sourceUrl: "https://www.consultant.ru/document/cons_doc_LAW_64871/",
    dataUpdatedAt: "2026-08-27",
    author: DEFAULT_AUTHOR,
  },
  {
    slug: "samozanyatost-vs-trudovoy-dogovor",
    title: "Самозанятость и трудовой договор: что теряешь и что экономишь",
    metaDescription:
      "Сравнение самозанятости и трудового договора в 2026 году: налоги, отпуск, больничный и пенсионные взносы — что положено по умолчанию, а за что нужно платить самому.",
    excerpt:
      "Разница не только в ставке налога: у трудоустроенного отпуск, больничный и пенсионный стаж включены по умолчанию — у самозанятого это отдельные, посчитанные в рублях решения.",
    status: "published",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-27",
    relatedCalculatorSlugs: [
      "trudovoy-dogovor-vs-samozanyatost",
      "ndfl",
      "bolnichnyy",
      "otpusknye",
    ],
    mainKeyword: "самозанятость или трудовой договор что выгоднее",
    secondaryKeywords: [
      "налог на профессиональный доход 2026",
      "больничный для самозанятых 2026",
      "пенсионные взносы для самозанятых",
    ],
    sourceLabel: "закон № 422-ФЗ, ст. 115 ТК РФ",
    sourceUrl: "https://www.consultant.ru/document/cons_doc_LAW_311977/",
    dataUpdatedAt: "2026-08-27",
    author: DEFAULT_AUTHOR,
  },
];

export function getPublishedArticles(): Article[] {
  return ARTICLES.filter((article) => article.status === "published").sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug && article.status === "published");
}
