import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { paths, routes } from "@/components/layout/navigation";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listChalets } from "@/features/chalets";
import { whatsappUrl } from "@/features/guests/domain";
import { getMyProfile } from "@/features/profile/services";
import {
  buildQuoteDocument,
  DeleteQuoteCard,
  getQuote,
  QuoteDocumentCard,
  quoteMessage,
  QuoteShare,
} from "@/features/quotes";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Orçamento" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, profile, chalets] = await Promise.all([getQuote(id), getMyProfile(), listChalets()]);
  if (!quote) notFound();
  const chalet = chalets.find((candidate) => candidate.id === quote.chalet_id);
  if (!chalet) notFound();

  const doc = buildQuoteDocument({
    quote,
    chalet,
    issuer: profile?.business_name || profile?.full_name || "Chalés",
    issuerPhone: profile?.phone ?? null,
    pixKey: profile?.pix_key ?? null,
    today: todayIso(),
  });
  const message = quoteMessage(doc);

  return (
    <>
      <PageHeader
        title="Orçamento"
        back={{ href: routes.quotes, label: "Orçamentos" }}
        actions={
          <ButtonLink
            href={paths.newReservation({
              chalet: quote.chalet_id,
              checkIn: quote.check_in,
              checkOut: quote.check_out,
              adults: quote.adults,
              children: quote.children,
              guestName: quote.guest_name,
              guestPhone: quote.guest_phone ?? undefined,
            })}
            size="sm"
          >
            <CalendarPlus aria-hidden="true" />
            Criar reserva
          </ButtonLink>
        }
      />
      <PageBody className="max-w-3xl">
        <QuoteDocumentCard doc={doc} />
        <QuoteShare data={doc} message={message} whatsappHref={whatsappUrl(quote.guest_phone, message)} />
        <DeleteQuoteCard quoteId={quote.id} />
      </PageBody>
    </>
  );
}
