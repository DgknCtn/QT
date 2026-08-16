import { z } from "zod";

/**
 * Typed `FormData` readers.
 *
 * Server actions used to cast fields straight off `FormData`
 * (`form.get("price") as string` -> `parseFloat(...)`), so an empty or
 * malformed field became `NaN` and surfaced as an opaque Prisma error. These
 * helpers fail early with a message that names the offending field.
 */

export class FormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormValidationError";
  }
}

function raw(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function requiredString(form: FormData, key: string, label = key): string {
  const v = raw(form, key);
  if (v === null) throw new FormValidationError(`${label} zorunlu.`);
  return v;
}

export function optionalString(form: FormData, key: string): string | null {
  return raw(form, key);
}

export function requiredNumber(form: FormData, key: string, label = key): number {
  const v = raw(form, key);
  if (v === null) throw new FormValidationError(`${label} zorunlu.`);
  const n = Number(v);
  if (!Number.isFinite(n)) throw new FormValidationError(`${label} geçerli bir sayı olmalı.`);
  return n;
}

export function optionalNumber(form: FormData, key: string, label = key): number | null {
  const v = raw(form, key);
  if (v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new FormValidationError(`${label} geçerli bir sayı olmalı.`);
  return n;
}

export function requiredInt(form: FormData, key: string, label = key): number {
  const n = requiredNumber(form, key, label);
  if (!Number.isInteger(n)) throw new FormValidationError(`${label} tam sayı olmalı.`);
  return n;
}

export function optionalInt(form: FormData, key: string, label = key): number | null {
  const n = optionalNumber(form, key, label);
  if (n === null) return null;
  if (!Number.isInteger(n)) throw new FormValidationError(`${label} tam sayı olmalı.`);
  return n;
}

export function optionalDate(form: FormData, key: string, label = key): Date | null {
  const v = raw(form, key);
  if (v === null) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new FormValidationError(`${label} geçerli bir tarih olmalı.`);
  return d;
}

export function requiredDate(form: FormData, key: string, label = key): Date {
  const d = optionalDate(form, key, label);
  if (d === null) throw new FormValidationError(`${label} zorunlu.`);
  return d;
}

/** Reads a field that must be one of a fixed set (a Prisma enum, typically). */
export function requiredEnum<T extends string>(
  form: FormData,
  key: string,
  values: readonly T[],
  label = key
): T {
  const v = requiredString(form, key, label);
  const parsed = z.enum(values as unknown as [T, ...T[]]).safeParse(v);
  if (!parsed.success) {
    throw new FormValidationError(`${label} geçersiz: "${v}".`);
  }
  return parsed.data;
}

export function optionalEnum<T extends string>(
  form: FormData,
  key: string,
  values: readonly T[],
  label = key
): T | null {
  const v = raw(form, key);
  if (v === null) return null;
  return requiredEnum(form, key, values, label);
}
