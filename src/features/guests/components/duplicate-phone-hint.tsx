import Link from "next/link";

import { paths } from "@/components/layout/navigation";

import { findGuestByPhone, type GuestContact } from "../domain";

interface DuplicatePhoneHintProps {
  contacts: GuestContact[];
  phone: string;
  /** O próprio cadastro (na edição) não conta como repetido. */
  exceptId?: string;
  /** Em vez do link para a ficha, um botão para usar o cadastro existente (nova reserva). */
  onUseExisting?: (id: string) => void;
}

/** Aviso quando o telefone digitado já pertence a outro hóspede, para não duplicar cadastro. */
export function DuplicatePhoneHint({ contacts, phone, exceptId, onUseExisting }: DuplicatePhoneHintProps) {
  const match = findGuestByPhone(contacts, phone, exceptId);
  if (!match) return null;
  return (
    <p role="status" className="animate-pop rounded-xl bg-accent-soft px-3 py-2.5 text-sm text-accent-ink">
      Este telefone já é de <strong className="font-semibold">{match.full_name}</strong>.{" "}
      {onUseExisting ? (
        <button
          type="button"
          onClick={() => onUseExisting(match.id)}
          className="-my-2 inline-flex min-h-10 items-center font-semibold underline underline-offset-2"
        >
          Usar esse cadastro
        </button>
      ) : (
        <Link href={paths.guest(match.id)} className="font-semibold underline underline-offset-2">
          Ver ficha
        </Link>
      )}
    </p>
  );
}
