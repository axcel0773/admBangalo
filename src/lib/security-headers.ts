/**
 * Cabeçalhos de segurança aplicados a todas as respostas (next.config.ts).
 * Função pura para poder testar a política sem subir o servidor.
 */

export interface SecurityHeadersInput {
  /** URL do projeto Supabase (API, Auth, Storage e Realtime). */
  supabaseUrl: string;
  /** `next dev` precisa de eval e websocket do HMR. */
  development: boolean;
  /** Site servido em HTTPS (Vercel/produção): liga HSTS e upgrade-insecure-requests. */
  https: boolean;
}

export interface Header {
  key: string;
  value: string;
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy({ supabaseUrl, development, https }: SecurityHeadersInput): string {
  const supabase = originOf(supabaseUrl);
  const supabaseWs = supabase ? supabase.replace(/^http/, "ws") : null;

  const directives: Record<string, (string | null | false)[]> = {
    "default-src": ["'self'"],
    // O App Router injeta scripts inline para hidratação; sem nonce, 'unsafe-inline' é necessário.
    "script-src": ["'self'", "'unsafe-inline'", development && "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Comprovantes abrem por link assinado do Storage; fotos podem virar blob: antes do envio.
    "img-src": ["'self'", "data:", "blob:", supabase],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", supabase, supabaseWs, development && "ws:"],
    "frame-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": https ? [] : [false],
  };

  return Object.entries(directives)
    .filter(([, values]) => !values.includes(false) || values.some(Boolean))
    .map(([name, values]) => [name, ...values.filter(Boolean)].join(" "))
    .join("; ");
}

export function securityHeaders(input: SecurityHeadersInput): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(input) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Câmera liberada para tirar foto do comprovante; o resto desligado.
    { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (input.https) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  return headers;
}
