import { NextResponse, type NextRequest } from "next/server";

import { getIcalFeed } from "@/features/availability";

const TOKEN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\.ics)?$/i;

/**
 * GET /ical/<token>.ics — calendário público do bangalô para Airbnb/Booking importarem.
 * Sem login (quem chama é o servidor da plataforma); só datas ocupadas, nunca dados de hóspedes.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const match = TOKEN.exec((await params).token);
  if (!match?.[1]) return new NextResponse("Calendário não encontrado", { status: 404 });

  const ics = await getIcalFeed(match[1].toLowerCase());
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="disponibilidade.ics"',
      // As plataformas leem a cada poucas horas; 15 min de cache poupa o banco.
      "Cache-Control": "public, max-age=900",
      "X-Robots-Tag": "noindex",
    },
  });
}
