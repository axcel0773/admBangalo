import { NextResponse, type NextRequest } from "next/server";

import { getCurrentOwner } from "@/features/auth/session";
import { getMonthCsv, monthParam, parseMonthParam } from "@/features/finance";
import { todayIso } from "@/lib/dates";

/** GET /financeiro/exportar?mes=2026-11 → CSV das reservas do mês. */
export async function GET(request: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const month = parseMonthParam(request.nextUrl.searchParams.get("mes") ?? undefined, todayIso());
  const csv = await getMonthCsv(month);

  // BOM: o Excel reconhece UTF-8 (acentos) ao abrir com dois cliques.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-${monthParam(month)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
