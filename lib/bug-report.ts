import nodemailer from "nodemailer";

export type BugReportInput = {
  description: string;
  pageUrl: string;
  contactEmail?: string;
};

/**
 * Отправляет багрепорт напрямую через SMTP (nodemailer), без стороннего сервиса рассылки.
 * Работает и с localhost - письмо уходит прямым SMTP-соединением, серверная инфраструктура не
 * нужна. Настраивается через переменные окружения BUG_REPORT_* - см. .env.example.
 */
export async function sendBugReport(input: BugReportInput): Promise<void> {
  const host = process.env.BUG_REPORT_SMTP_HOST;
  const port = process.env.BUG_REPORT_SMTP_PORT;
  const user = process.env.BUG_REPORT_SMTP_USER;
  const password = process.env.BUG_REPORT_SMTP_PASSWORD;
  const to = process.env.BUG_REPORT_TO_EMAIL;

  if (!host || !port || !user || !password || !to) {
    throw new Error(
      "Отправка багрепортов не настроена - заполните BUG_REPORT_* в .env.local (см. .env.example)",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: user,
    to,
    replyTo: input.contactEmail || undefined,
    subject: `Багрепорт с сайта -${input.pageUrl}`,
    text: [
      `Страница: ${input.pageUrl}`,
      input.contactEmail ? `Контакт для ответа: ${input.contactEmail}` : null,
      "",
      "Описание:",
      input.description,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}
