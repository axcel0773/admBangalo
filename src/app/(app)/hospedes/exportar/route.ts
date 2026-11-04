import { NextResponse } from "next/server";

import { getCurrentOwner } from "@/features/auth/session";
import { getGuestsCsv } from "@/features/guests";
import { CSV_BOM, csvResponseInit } from "@/lib/csv";
import { todayIso } from "@/lib/dates";

/** GET /hospedes/exportar → CSV com o cadastro de todos os hóspedes. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return new NextResponse(`${CSV_BOM}${await getGuestsCsv()}`, csvResponseInit(`hospedes-${todayIso()}.csv`));
}
