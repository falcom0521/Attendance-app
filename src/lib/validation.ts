import { z } from 'zod';
import { differenceInCalendarDays, differenceInYears, isValid, parseISO } from 'date-fns';

/**
 * Shared, reusable validation rules. Every form builds its zod schema from these so the same field
 * (name, email, phone, code, date…) is validated identically everywhere and messages stay consistent.
 * All text rules trim first, so whitespace-only input counts as empty.
 */

export const LIMITS = {
  name: 50,
  title: 100,
  place: 60,
  address: 200,
  description: 200,
  reason: 300,
  notes: 500,
  email: 120,
  search: 100,
} as const;

const today = () => new Date().toISOString().slice(0, 10);

// ── Text ────────────────────────────────────────────────────────────────────
/** Required text: trimmed, at least `min` (default 1) and at most `max` characters. */
export function requiredText(label: string, opts: { min?: number; max?: number } = {}) {
  const { min = 1, max = LIMITS.title } = opts;
  let schema = z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`);
  if (min > 1) schema = schema.min(min, `${label} must be at least ${min} characters`);
  return schema.max(max, `${label} must be ${max} characters or fewer`);
}

/** Optional free text (blank allowed), trimmed, with a maximum length. */
export function optionalText(label: string, max: number = LIMITS.description) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional();
}

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

/** A person's first or last name: letters, spaces, apostrophes, hyphens and dots. */
export function personName(label: string) {
  return requiredText(label, { max: LIMITS.name }).regex(
    NAME_RE,
    `${label} can only contain letters, spaces, apostrophes, hyphens and dots`
  );
}

/** City, state, country. */
export function placeName(label: string) {
  return requiredText(label, { min: 2, max: LIMITS.place }).regex(
    NAME_RE,
    `${label} can only contain letters, spaces, apostrophes, hyphens and dots`
  );
}

/** Short identifier such as a company, branch, employee or device code. */
export function codeField(label: string, min = 2, max = 20) {
  return requiredText(label, { min, max }).regex(
    /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
    `${label} can only contain letters, numbers, hyphens and underscores`
  );
}

export const emailField = z
  .string({ required_error: 'Email is required', invalid_type_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(LIMITS.email, `Email must be ${LIMITS.email} characters or fewer`)
  .email('Enter a valid email address');

export const phoneField = z
  .string({ required_error: 'Phone is required', invalid_type_error: 'Phone is required' })
  .trim()
  .min(1, 'Phone is required')
  .regex(/^\+?[0-9][0-9\s\-()]*$/, 'Enter a valid phone number (digits, spaces, + - ( ) only)')
  .refine((v) => {
    const digits = v.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15;
  }, 'Phone number must have 7 to 15 digits');

export const usernameField = z
  .string({ required_error: 'Username is required', invalid_type_error: 'Username is required' })
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or fewer')
  .regex(/^[A-Za-z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens and underscores');

/** A new password: 8–64 characters with at least one letter and one number. */
export const newPasswordField = z
  .string({ required_error: 'Password is required', invalid_type_error: 'Password is required' })
  .min(8, 'Use at least 8 characters')
  .max(64, 'Use 64 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

/** Optional temporary password: blank is allowed (the system assigns one), otherwise it must be strong enough. */
export const optionalPasswordField = z.union([z.literal(''), newPasswordField]).optional();

// ── Numbers ─────────────────────────────────────────────────────────────────
/** Whole number within [min, max]. Use with `register(name, { valueAsNumber: true })`. */
export function intInRange(label: string, min: number, max: number) {
  return z
    .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be ${max} or less`);
}

/** Optional whole number within [min, max]; blank/undefined is allowed. Use with `register(name, { valueAsNumber: true })`. */
export function optionalIntInRange(label: string, min: number, max: number) {
  return z
    .union([z.nan(), intInRange(label, min, max)])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));
}

// ── Dates & times ───────────────────────────────────────────────────────────
const isRealDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && isValid(parseISO(v));

/** A valid `YYYY-MM-DD` date. */
export function dateField(label: string) {
  return z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .min(1, `${label} is required`)
    .refine(isRealDate, `Enter a valid ${label.toLowerCase()}`);
}

/** Valid date that is today or earlier. */
export function pastOrTodayDate(label: string) {
  return dateField(label).refine((v) => !isRealDate(v) || v <= today(), `${label} cannot be in the future`);
}

/** Minimum age at which someone can be employed. */
export const MIN_EMPLOYEE_AGE = 17;

/**
 * Cross-field check for an employee: the joining date must fall after the date of birth, and the
 * employee must be at least `minAge` on the joining date. Returns an error message, or `null` when fine
 * (also `null` when either date is missing / not a real date — those have their own field errors).
 */
export function joiningDateProblem(dob: string, joining: string, minAge = MIN_EMPLOYEE_AGE): string | null {
  if (!isRealDate(dob) || !isRealDate(joining)) return null;
  if (joining <= dob) return 'Joining date must be after the date of birth';
  if (differenceInYears(parseISO(joining), parseISO(dob)) < minAge) {
    return `Employee must be at least ${minAge} years old on the joining date`;
  }
  return null;
}

/** Valid date of birth: not in the future and at least `minAge` years old. */
export function birthDateField(minAge = MIN_EMPLOYEE_AGE) {
  return dateField('Date of birth')
    .refine((v) => !isRealDate(v) || v <= today(), 'Date of birth cannot be in the future')
    .refine(
      (v) => !isRealDate(v) || v > today() || differenceInYears(new Date(), parseISO(v)) >= minAge,
      `Employee must be at least ${minAge} years old`
    )
    .refine((v) => !isRealDate(v) || v >= '1900-01-01', 'Enter a valid date of birth');
}

/** Valid date no more than `days` days in the future (e.g. a joining date). */
export function dateWithinFuture(label: string, days: number) {
  return dateField(label).refine(
    (v) => !isRealDate(v) || differenceInCalendarDays(parseISO(v), new Date()) <= days,
    `${label} cannot be more than ${days} days ahead`
  );
}

export const timeField = (label: string) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .min(1, `${label} is required`)
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} must be a valid time (HH:mm)`);

export const optionalTimeField = (label: string) =>
  z.union([z.literal(''), timeField(label)]).optional();

// ── Network / identifiers ───────────────────────────────────────────────────
export const ipv4Field = z
  .string({ required_error: 'IP address is required', invalid_type_error: 'IP address is required' })
  .trim()
  .min(1, 'IP address is required')
  .regex(
    /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/,
    'Enter a valid IPv4 address (e.g. 192.168.1.100)'
  );

export const macField = z
  .string({ required_error: 'MAC address is required', invalid_type_error: 'MAC address is required' })
  .trim()
  .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, 'Invalid MAC address (e.g. 00:1A:2B:3C:4D:5E)');

/** A valid IANA timezone such as `Asia/Kolkata`. */
export const timezoneField = z
  .string({ required_error: 'Timezone is required', invalid_type_error: 'Timezone is required' })
  .trim()
  .min(1, 'Timezone is required')
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Enter a valid timezone (e.g. Asia/Kolkata)');

/** Free-text reason: required, meaningful length. */
export const reasonField = (min = 5, max: number = LIMITS.reason) => requiredText('Reason', { min, max });

// ── Files ───────────────────────────────────────────────────────────────────
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_TYPES = ['image/png', 'image/jpeg'];

/** Returns an error message for an unacceptable logo file, or `null` when it is fine. */
export function validateLogoFile(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) return 'Logo must be a PNG or JPG image';
  if (file.size === 0) return 'The selected file is empty';
  if (file.size > LOGO_MAX_BYTES) {
    return `Logo must be 2 MB or smaller (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  }
  return null;
}
