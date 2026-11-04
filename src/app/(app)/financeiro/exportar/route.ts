import { NextResponse, type NextRequest } from "next/server";

import { getCurrentOwner } from "@/features/auth/session";
import { getMonthCsv, monthParam, parseMonthParam } from "@/features/finance";
import { CSV_BOM, csvResponseInit } from "@/lib/csv";
import { todayIso } from "@/lib/dates";

/** GET /financeiro/exportar?mes=2026-11 → CSV das reservas do mês. */
export async function GET(request: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const month = parseMonthParam(request.nextUrl.searchParams.get("mes") ?? undefined, todayIso());
  return new NextResponse(`${CSV_BOM}${await getMonthCsv(month)}`, csvResponseInit(`financeiro-${monthParam(month)}.csv`));
}
