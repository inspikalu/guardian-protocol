import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function decodeString(bytes: number[] | Uint8Array | Buffer | string): string {
  if (!bytes) return "";
  if (typeof bytes === 'string') return bytes;
  const buf = Buffer.from(bytes);
  const firstNull = buf.indexOf(0);
  return buf.slice(0, firstNull === -1 ? buf.length : firstNull).toString('utf8');
}
