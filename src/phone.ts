export function toWa(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return digits.slice(0, 13);
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export function displayNg(phone: string): string {
  const digits = toWa(phone);
  if (digits.length === 13) {
    return `0${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

export function isNgPhone(phone: string): boolean {
  return toWa(phone).length === 13;
}
