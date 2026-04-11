/**
 * Formata um número de telefone brasileiro enquanto o usuário digita.
 * Suporta celular (11 dígitos) e fixo (10 dígitos).
 *
 * Exemplos:
 *   "11" → "(11"
 *   "1199" → "(11) 99"
 *   "11999887766" → "(11) 99988-7766"
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Gera URL do WhatsApp (wa.me) a partir de um telefone.
 * Adiciona o DDI 55 automaticamente se não estiver presente.
 */
export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  const base = `https://wa.me/${withCountry}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
