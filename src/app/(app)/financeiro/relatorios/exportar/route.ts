import { NextResponse, type NextRequest } from "next/server";

import { getCurrentOwner } from "@/features/auth/session";
import { getYearReportCsv, parseYearParam } from "@/features/finance";
import { CSV_BOM, csvResponseInit } from "@/lib/csv";
import { todayIso } from "@/lib/dates";

/** GET /financeiro/relatorios/exportar?ano=2026 → CSV mês a mês do ano. */
export async function GET(request: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const year = parseYearParam(request.nextUrl.searchParams.get("ano") ?? undefined, todayIso());
  return new NextResponse(`${CSV_BOM}${await getYearReportCsv(year)}`, csvResponseInit(`relatorio-${year}.csv`));
}
