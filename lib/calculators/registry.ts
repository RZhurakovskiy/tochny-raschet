export type CategorySlug =
  | "zarplata-i-nalogi"
  | "otpuska-i-uvolnenie"
  | "posobiya"
  | "semya"
  | "dolgi-i-shtrafy"
  | "ipoteka";

export type Category = {
  slug: CategorySlug;
  title: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "zarplata-i-nalogi",
    title: "Зарплата и налоги",
    description: "Расчёт НДФЛ и зарплаты на руки",
  },
  {
    slug: "otpuska-i-uvolnenie",
    title: "Отпуска и увольнение",
    description: "Отпускные и компенсации при увольнении",
  },
  {
    slug: "posobiya",
    title: "Больничные и пособия",
    description: "Больничный лист и уход за ребёнком",
  },
  {
    slug: "semya",
    title: "Семья и дети",
    description: "Алименты, декретные и вычеты на детей",
  },
  {
    slug: "dolgi-i-shtrafy",
    title: "Долги и штрафы",
    description: "Пени, штрафы и исполнительский сбор",
  },
  {
    slug: "ipoteka",
    title: "Ипотека",
    description: "Досрочное погашение и налоговый вычет по процентам",
  },
];

export type CalculatorStatus = "published" | "planned";

export type Calculator = {
  slug: string;
  title: string;
  shortTitle: string;
  category: CategorySlug;
  description: string;
  mainKeyword: string;
  secondaryKeywords: string[];
  status: CalculatorStatus;
  /** Порядковый номер публикации по карте ключевых слов (Этап 0.5) */
  priority: number;
};

export const CALCULATORS: Calculator[] = [
  {
    slug: "ndfl",
    title: "Калькулятор НДФЛ и зарплаты на руки",
    shortTitle: "НДФЛ",
    category: "zarplata-i-nalogi",
    description: "Расчёт НДФЛ по прогрессивной шкале 2026 года и суммы зарплаты на руки.",
    mainKeyword: "калькулятор ндфл",
    secondaryKeywords: ["калькулятор зарплаты на руки", "ндфл с зарплаты калькулятор"],
    status: "published",
    priority: 1,
  },
  {
    slug: "oklad-iz-zarplaty-na-ruki",
    title: "Калькулятор оклада по зарплате на руки",
    shortTitle: "Оклад по зарплате на руки",
    category: "zarplata-i-nalogi",
    description:
      "Обратный расчёт: по желаемой сумме на руки калькулятор находит нужный оклад до вычета НДФЛ.",
    mainKeyword: "калькулятор оклада по зарплате на руки",
    secondaryKeywords: ["как узнать оклад по сумме на руки", "перевести зарплату на руки в оклад"],
    status: "published",
    priority: 1.5,
  },
  {
    slug: "otpusknye",
    title: "Калькулятор отпускных",
    shortTitle: "Отпускные",
    category: "otpuska-i-uvolnenie",
    description: "Расчёт отпускных по среднедневному заработку.",
    mainKeyword: "калькулятор отпускных",
    secondaryKeywords: ["расчет отпускных онлайн", "калькулятор отпускных с ндфл"],
    status: "published",
    priority: 2,
  },
  {
    slug: "kompensaciya-otpuska",
    title: "Калькулятор компенсации за неиспользованный отпуск",
    shortTitle: "Компенсация за отпуск",
    category: "otpuska-i-uvolnenie",
    description: "Расчёт компенсации за неиспользованный отпуск при увольнении.",
    mainKeyword: "калькулятор компенсации за неиспользованный отпуск",
    secondaryKeywords: ["расчет компенсации при увольнении онлайн"],
    status: "published",
    priority: 3,
  },
  {
    slug: "bolnichnyy",
    title: "Калькулятор больничного листа",
    shortTitle: "Больничный",
    category: "posobiya",
    description: "Расчёт пособия по временной нетрудоспособности по стажу.",
    mainKeyword: "калькулятор больничного листа",
    secondaryKeywords: ["расчет больничного онлайн", "калькулятор больничного по стажу"],
    status: "published",
    priority: 4,
  },
  {
    slug: "alimenty",
    title: "Калькулятор алиментов",
    shortTitle: "Алименты",
    category: "semya",
    description: "Расчёт алиментов в долях от дохода на одного, двух и более детей.",
    mainKeyword: "калькулятор алиментов",
    secondaryKeywords: [
      "расчет алиментов на 1 ребенка калькулятор",
      "калькулятор алиментов на 2 детей",
    ],
    status: "published",
    priority: 5,
  },
  {
    slug: "dekretnye",
    title: "Калькулятор пособия по беременности и родам",
    shortTitle: "Декретные",
    category: "semya",
    description: "Расчёт декретных выплат по среднедневному заработку.",
    mainKeyword: "калькулятор декретных выплат",
    secondaryKeywords: ["калькулятор пособия по беременности и родам", "расчет декретных онлайн"],
    status: "published",
    priority: 6,
  },
  {
    slug: "vyplaty-v-dekrete",
    title: "Калькулятор выплат в декрете",
    shortTitle: "Выплаты в декрете",
    category: "semya",
    description:
      "Пошаговый расчёт по дате родов: декретные, пособие по уходу за ребёнком до 1,5 лет и вычет на детей по НДФЛ - вся хронология декрета одним потоком.",
    mainKeyword: "калькулятор выплат в декрете",
    secondaryKeywords: [
      "пособие по уходу за ребенком до 1.5 лет калькулятор",
      "расчет декрета и пособий по уходу",
    ],
    status: "published",
    priority: 6.5,
  },
  {
    slug: "peni",
    title: "Калькулятор пени по налогам и ЖКХ",
    shortTitle: "Пени",
    category: "dolgi-i-shtrafy",
    description: "Расчёт пени по налоговой задолженности и просрочке ЖКХ.",
    mainKeyword: "калькулятор пени по налогам",
    secondaryKeywords: ["калькулятор пени по жкх", "расчет пени 1/300 ставки цб"],
    status: "published",
    priority: 7,
  },
  {
    slug: "ispolnitelskiy-sbor",
    title: "Калькулятор исполнительского сбора судебных приставов",
    shortTitle: "Исполнительский сбор",
    category: "dolgi-i-shtrafy",
    description:
      "Расчёт исполнительского сбора приставов - 12% от суммы долга (с минимумом) для денежных требований или фиксированная сумма для неимущественных.",
    mainKeyword: "калькулятор исполнительского сбора",
    secondaryKeywords: ["исполнительский сбор 12 процентов", "минимальный исполнительский сбор"],
    status: "published",
    priority: 7.5,
  },
  {
    slug: "shtraf-gibdd",
    title: "Калькулятор штрафа ГИБДД со скидкой",
    shortTitle: "Штраф ГИБДД со скидкой",
    category: "dolgi-i-shtrafy",
    description: "Расчёт суммы штрафа ГИБДД со скидкой 25% при оплате в течение 30 дней.",
    mainKeyword: "калькулятор штрафа гибдд",
    secondaryKeywords: ["штраф гибдд скидка 50 процентов", "скидка на штраф гибдд 25 процентов"],
    status: "published",
    priority: 11,
  },
  {
    slug: "vykhodnoe-posobie",
    title: "Калькулятор выходного пособия при увольнении",
    shortTitle: "Выходное пособие",
    category: "otpuska-i-uvolnenie",
    description:
      "Расчёт выходного пособия при сокращении штата или ликвидации организации: за 1-3 месяца после увольнения.",
    mainKeyword: "калькулятор выходного пособия",
    secondaryKeywords: [
      "выходное пособие при сокращении расчет",
      "средний заработок на период трудоустройства калькулятор",
    ],
    status: "published",
    priority: 10,
  },
  {
    slug: "vyplaty-pri-sokraschenii",
    title: "Калькулятор выплат при увольнении",
    shortTitle: "Выплаты при увольнении",
    category: "otpuska-i-uvolnenie",
    description:
      "Пошаговый расчёт выплат при увольнении: компенсация за отпуск - для любой причины увольнения, плюс выходное пособие - при сокращении штата или ликвидации организации.",
    mainKeyword: "калькулятор выплат при сокращении",
    secondaryKeywords: [
      "что положено при сокращении калькулятор",
      "компенсация при увольнении по собственному желанию калькулятор",
    ],
    status: "published",
    priority: 10.5,
  },
  {
    slug: "bolnichnyy-po-uhodu",
    title: "Калькулятор больничного по уходу за ребёнком",
    shortTitle: "Больничный по уходу за ребёнком",
    category: "posobiya",
    description:
      "Расчёт пособия по больничному листу по уходу за ребёнком: с учётом возраста ребёнка, стажа и вида лечения.",
    mainKeyword: "калькулятор больничного по уходу за ребенком",
    secondaryKeywords: [
      "расчет больничного по уходу за ребенком",
      "как оплачивается больничный по уходу за ребенком",
    ],
    status: "published",
    priority: 9,
  },
  {
    slug: "trudovoy-dogovor-vs-samozanyatost",
    title: "Калькулятор «трудовой договор или самозанятость»",
    shortTitle: "Трудовой договор vs самозанятость",
    category: "zarplata-i-nalogi",
    description:
      "Сравнение одного и того же дохода в двух формах: НДФЛ по трудовому договору против налога на профессиональный доход (НПД) у самозанятого, с учётом цены добровольного соцпакета.",
    mainKeyword: "трудовой договор или самозанятость калькулятор",
    secondaryKeywords: [
      "что выгоднее самозанятость или трудовой договор",
      "сравнить налоги самозанятый и по трудовому договору",
    ],
    status: "published",
    priority: 8.5,
  },
  {
    slug: "detskie-vychety",
    title: "Калькулятор детских вычетов по НДФЛ",
    shortTitle: "Детские вычеты",
    category: "semya",
    description: "Расчёт стандартного налогового вычета на детей и экономии по НДФЛ.",
    mainKeyword: "налоговый вычет на детей",
    secondaryKeywords: [
      "калькулятор детских вычетов по ндфл",
      "стандартный вычет на ребенка сумма",
    ],
    status: "published",
    priority: 8,
  },
  {
    slug: "ipoteka-dosrochnoe-pogashenie",
    title: "Калькулятор досрочного погашения ипотеки и вычета по процентам",
    shortTitle: "Досрочное погашение ипотеки",
    category: "ipoteka",
    description:
      "Для тех, у кого уже есть ипотека: на сколько сократится срок или платёж при досрочном погашении, и как выгоднее разделить вычет по процентам между супругами.",
    mainKeyword: "калькулятор досрочного погашения ипотеки",
    secondaryKeywords: [
      "выгодно ли досрочно гасить ипотеку калькулятор",
      "вычет по процентам ипотеки калькулятор",
      "как разделить налоговый вычет между супругами ипотека",
    ],
    status: "published",
    priority: 12,
  },
];

export function getCalculatorBySlug(slug: string): Calculator | undefined {
  return CALCULATORS.find((calculator) => calculator.slug === slug);
}

export function getCalculatorsByCategory(category: CategorySlug): Calculator[] {
  return CALCULATORS.filter((calculator) => calculator.category === category).sort(
    (a, b) => a.priority - b.priority,
  );
}

export function getPublishedCalculators(): Calculator[] {
  return CALCULATORS.filter((calculator) => calculator.status === "published").sort(
    (a, b) => a.priority - b.priority,
  );
}

export function getRelatedCalculators(slug: string, limit = 3): Calculator[] {
  const current = getCalculatorBySlug(slug);
  if (!current) return [];
  return CALCULATORS.filter(
    (calculator) => calculator.slug !== slug && calculator.category === current.category,
  ).slice(0, limit);
}

export function getCategoryBySlug(slug: CategorySlug): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

/**
 * Ручной список «популярных сейчас» калькуляторов для главной страницы - подбирается по
 * сезонности из keyword-map.md (например, больничный осенью/зимой, отпускные весной/летом).
 * Без реального трафика с сайта автоматический рейтинг строить не на чем, поэтому список
 * обновляется руками по сезону, а не считается динамически.
 */
export const POPULAR_NOW_SLUGS: string[] = ["bolnichnyy", "ndfl", "otpusknye", "peni"];

export function getPopularNowCalculators(): Calculator[] {
  return POPULAR_NOW_SLUGS.map((slug) => getCalculatorBySlug(slug)).filter(
    (calculator): calculator is Calculator => calculator?.status === "published",
  );
}
