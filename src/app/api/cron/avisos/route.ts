import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { runDailyDigest } from "@/features/notifications";

function authorized(request: NextRequest, secret: string): boolean {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * GET /api/cron/avisos — chamado uma vez por dia pelo cron da Vercel (vercel.json).
 * A Vercel envia `Authorization: Bearer <CRON_SECRET>`; o mesmo segredo abre a função do banco.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: "Cron não configurado" }, { status: 503 });
  if (!authorized(request, secret)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const run = await runDailyDigest(secret);
  if (!run) return NextResponse.json({ error: "Chaves de envio não configuradas" }, { status: 503 });
  return NextResponse.json(run);
}
