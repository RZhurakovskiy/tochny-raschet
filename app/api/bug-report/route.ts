import { NextResponse } from "next/server";
import { sendBugReport } from "@/lib/bug-report";

const MIN_DESCRIPTION_LENGTH = 10;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { description, pageUrl, contactEmail } = (body ?? {}) as Record<string, unknown>;

  if (typeof description !== "string" || description.trim().length < MIN_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `Опишите проблему подробнее (не менее ${MIN_DESCRIPTION_LENGTH} символов)` },
      { status: 400 },
    );
  }
  if (typeof pageUrl !== "string" || pageUrl.trim() === "") {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (contactEmail !== undefined && typeof contactEmail !== "string") {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  try {
    await sendBugReport({
      description: description.trim(),
      pageUrl: pageUrl.trim(),
      contactEmail: contactEmail?.trim() || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось отправить багрепорт:", error);
    return NextResponse.json(
      { error: "Не удалось отправить - попробуйте позже или напишите напрямую" },
      { status: 500 },
    );
  }
}
