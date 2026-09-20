export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

export function truncate(str: string, length = 30): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}…`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => capitalize(w))
    .join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
