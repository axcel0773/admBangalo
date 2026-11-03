import { describe, expect, it } from "vitest";

import { blockWarning, blocksNight, overlappingBlocks, rangesOverlap, type ChaletBlock } from "./blocks";
import { buildIcs, icalDate, icalUrlProblem, parseIcs, relevantEvents } from "./ical";

const AIRBNB = [
  "BEGIN:VCALENDAR",
  "PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 1.0//EN",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20261213",
  "DTSTART;VALUE=DATE:20261210",
  "UID:1418fb94e984-abc@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HM",
  " ABCDEF\\nPhone Number (Last 4 Digits): 1234",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART:20261220T140000Z",
  "DTEND:20261222T110000Z",
  "UID:booking-2",
  "SUMMARY:CLOSED - Not available",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20261225",
  "UID:um-dia",
  "SUMMARY:Bloqueio\\, manutenção",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20261228",
  "DTEND;VALUE=DATE:20261230",
  "STATUS:CANCELLED",
  "UID:cancelado",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("leitura de iCal (Airbnb/Booking)", () => {
  const events = parseIcs(AIRBNB);

  it("lê eventos de dia inteiro e com horário", () => {
    expect(events.map((e) => [e.uid, e.start, e.end])).toEqual([
      ["1418fb94e984-abc@airbnb.com", "2026-12-10", "2026-12-13"],
      ["booking-2", "2026-12-20", "2026-12-22"],
      ["um-dia", "2026-12-25", "2026-12-26"],
    ]);
  });

  it("junta linhas dobradas e desfaz escapes", () => {
    expect(events[2]?.summary).toBe("Bloqueio, manutenção");
  });

  it("ignora cancelados e datas inválidas", () => {
    expect(events.some((e) => e.uid === "cancelado")).toBe(false);
    expect(parseIcs("BEGIN:VEVENT\nDTSTART:abc\nEND:VEVENT")).toEqual([]);
    expect(icalDate("20261301")).toBeNull();
  });

  it("descarta o que já terminou", () => {
    expect(relevantEvents(events, "2026-12-21").map((e) => e.uid)).toEqual(["booking-2", "um-dia"]);
  });
});

describe("geração de iCal", () => {
  it("gera calendário válido que lemos de volta", () => {
    const ics = buildIcs({
      name: "Chalé Ipê; Serra",
      stamp: new Date("2026-11-03T12:00:00Z"),
      events: [{ uid: "r1@admbangalo", start: "2026-12-10", end: "2026-12-13", summary: "Reservado" }],
    });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Chalé Ipê\\; Serra");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261210");
    expect(ics).toContain("DTSTAMP:20261103T120000Z");
    expect(parseIcs(ics)).toEqual([{ uid: "r1@admbangalo", start: "2026-12-10", end: "2026-12-13", summary: "Reservado" }]);
  });

  it("dobra linhas longas", () => {
    const ics = buildIcs({ name: "x".repeat(120), stamp: new Date(0), events: [] });
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});

describe("segurança do link importado", () => {
  it("aceita links públicos em https", () => {
    expect(icalUrlProblem("https://www.airbnb.com.br/calendar/ical/123.ics?s=abc")).toBeNull();
    expect(icalUrlProblem("https://admin.booking.com/hotel/hoteladmin/ical.html?t=x")).toBeNull();
  });

  it("recusa http, rede interna, IP e credenciais", () => {
    expect(icalUrlProblem("http://www.airbnb.com/x.ics")).toMatch(/https/);
    expect(icalUrlProblem("https://localhost/x.ics")).toMatch(/público/);
    expect(icalUrlProblem("https://192.168.0.10/x.ics")).toMatch(/público/);
    expect(icalUrlProblem("https://8.8.8.8/x.ics")).toMatch(/IP/);
    expect(icalUrlProblem("https://[::1]/x.ics")).not.toBeNull();
    expect(icalUrlProblem("https://user:pw@site.com/x.ics")).toMatch(/senha/);
    expect(icalUrlProblem("não é link")).toMatch(/link completo/);
  });
});

describe("bloqueios de datas", () => {
  const blocks: ChaletBlock[] = [
    { id: "b1", chalet_id: "c1", starts_on: "2026-12-01", ends_on: "2026-12-05", reason: "Pintura", source: "manual" },
    { id: "b2", chalet_id: "c1", starts_on: "2026-12-10", ends_on: "2026-12-13", reason: "Airbnb", source: "ical" },
  ];

  it("cruza períodos sem contar o dia da saída", () => {
    expect(rangesOverlap("2026-12-01", "2026-12-05", "2026-12-05", "2026-12-07")).toBe(false);
    expect(rangesOverlap("2026-12-01", "2026-12-05", "2026-12-04", "2026-12-07")).toBe(true);
  });

  it("acha os bloqueios do chalé na estadia", () => {
    expect(overlappingBlocks(blocks, "c1", "2026-12-04", "2026-12-11").map((b) => b.id)).toEqual(["b1", "b2"]);
    expect(overlappingBlocks(blocks, "c2", "2026-12-04", "2026-12-11")).toEqual([]);
    expect(overlappingBlocks(blocks, "c1", "2026-12-07", "2026-12-07")).toEqual([]);
  });

  it("bloqueio manual impede; importado só avisa", () => {
    expect(blockWarning([blocks[0]!, blocks[1]!])?.blocking).toBe(true);
    expect(blockWarning([blocks[1]!])).toEqual({
      blocking: false,
      message: "O calendário “Airbnb” já tem essas datas ocupadas. Se for a mesma reserva, pode seguir.",
    });
    expect(blockWarning([])).toBeNull();
  });

  it("noite bloqueada", () => {
    expect(blocksNight(blocks[0]!, "2026-12-04")).toBe(true);
    expect(blocksNight(blocks[0]!, "2026-12-05")).toBe(false);
  });
});
