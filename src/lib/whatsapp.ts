export function formatWhatsAppNumber(phone?: string | null) {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;

  return digits;
}
