import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

interface GradeScaleItem {
  grade: string
  minPercent: number
  maxPercent: number
  remark?: string
}

const defaultScale: GradeScaleItem[] = [
  { grade: "A", minPercent: 70, maxPercent: 100 },
  { grade: "B", minPercent: 60, maxPercent: 69 },
  { grade: "C", minPercent: 50, maxPercent: 59 },
  { grade: "D", minPercent: 45, maxPercent: 49 },
  { grade: "E", minPercent: 40, maxPercent: 44 },
  { grade: "F", minPercent: 0, maxPercent: 39 },
]

export function calculateGrade(total: number, maxTotal: number = 100, scale?: GradeScaleItem[]): string {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const grades = scale ?? defaultScale;
  for (const g of grades) {
    if (pct >= g.minPercent && pct <= g.maxPercent) return g.grade;
  }
  const sorted = [...grades].sort((a, b) => b.maxPercent - a.maxPercent);
  for (const g of sorted) {
    if (pct <= g.maxPercent) return g.grade;
  }
  return "F";
}

export function calculatePosition<T extends { total: number; studentId?: string }>(
  results: T[]
): (T & { position: number })[] {
  const sorted = [...results].sort((a, b) => b.total - a.total);
  return sorted.map((result, index) => ({
    ...result,
    position: index + 1,
  }));
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}
