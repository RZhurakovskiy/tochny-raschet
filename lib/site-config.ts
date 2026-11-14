export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ТочныйРасчёт",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Бесплатные калькуляторы для повседневных денежных и юридических задач: НДФЛ, отпускные, больничный, алименты и другие расчёты по актуальным формулам 2026 года.",
  locale: "ru_RU",
  yandexMetrikaId: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || undefined,
  yandexAdsBlockId: process.env.NEXT_PUBLIC_YANDEX_ADS_BLOCK_ID || undefined,
  yandexVerification: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
} as const;
