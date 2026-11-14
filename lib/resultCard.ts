import { siteConfig } from "@/lib/site-config";

export type ResultCardLine = {
  label: string;
  value: string;
  emphasis?: boolean;
};

export type ResultCardOptions = {
  calculatorTitle: string;
  lines: ResultCardLine[];
  siteUrl: string;
};

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const MARGIN = 64;

const COLOR_ACCENT = "#7c3aed";
const COLOR_FOREGROUND = "#18181b";
const COLOR_MUTED = "#71717a";
const COLOR_MUTED_SOFT = "#a1a1aa";
const COLOR_BORDER = "#e4e4e7";
const FONT_FAMILY = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

/** Подгоняет размер шрифта так, чтобы текст помещался в доступную ширину карточки. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `bold ${size}px ${FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

/** Рисует карточку результата расчёта на переданном canvas - для скачивания/шаринга картинкой. */
export function renderResultCard(canvas: HTMLCanvasElement, options: ResultCardOptions): void {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { calculatorTitle, lines, siteUrl } = options;
  const contentWidth = CARD_WIDTH - MARGIN * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = COLOR_ACCENT;
  ctx.fillRect(0, 0, CARD_WIDTH, 8);

  ctx.fillStyle = COLOR_ACCENT;
  ctx.font = `bold 32px ${FONT_FAMILY}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(siteConfig.name, MARGIN, 92);

  ctx.fillStyle = COLOR_MUTED;
  ctx.font = `28px ${FONT_FAMILY}`;
  ctx.fillText(calculatorTitle, MARGIN, 136);

  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 168);
  ctx.lineTo(CARD_WIDTH - MARGIN, 168);
  ctx.stroke();

  const emphasisLine = lines.find((line) => line.emphasis) ?? lines[lines.length - 1];
  const secondaryLines = lines.filter((line) => line !== emphasisLine).slice(0, 3);

  ctx.fillStyle = COLOR_MUTED;
  ctx.font = `26px ${FONT_FAMILY}`;
  ctx.fillText(emphasisLine.label, MARGIN, 226);

  const valueFontSize = fitFontSize(ctx, emphasisLine.value, contentWidth, 96, 48);
  ctx.fillStyle = COLOR_FOREGROUND;
  ctx.font = `bold ${valueFontSize}px ${FONT_FAMILY}`;
  ctx.fillText(emphasisLine.value, MARGIN, 226 + valueFontSize + 20);

  let y = 226 + valueFontSize + 20 + 56;
  ctx.font = `24px ${FONT_FAMILY}`;
  for (const line of secondaryLines) {
    if (y > CARD_HEIGHT - 90) break;
    ctx.fillStyle = COLOR_MUTED;
    ctx.fillText(`${line.label}:`, MARGIN, y);
    ctx.fillStyle = COLOR_FOREGROUND;
    const labelWidth = ctx.measureText(`${line.label}: `).width;
    ctx.fillText(line.value, MARGIN + labelWidth, y);
    y += 38;
  }

  ctx.fillStyle = COLOR_MUTED_SOFT;
  ctx.font = `22px ${FONT_FAMILY}`;
  ctx.fillText(siteUrl, MARGIN, CARD_HEIGHT - 40);
  ctx.textAlign = "right";
  ctx.fillText("Бесплатно и без регистрации", CARD_WIDTH - MARGIN, CARD_HEIGHT - 40);
  ctx.textAlign = "left";
}
