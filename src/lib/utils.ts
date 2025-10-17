import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const s = String(timeStr).trim();
  if (s === "") return "";

  // If already contains AM/PM, normalize the casing and spacing
  if (/(am|pm)$/i.test(s)) {
    return s.replace(/\s?(am|pm)$/i, (m) => " " + m.trim().toUpperCase());
  }

  // Handle formats like HH:mm or HH:mm:ss
  const parts = s.split(":");
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      const suffix = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      const mm = m.toString().padStart(2, "0");
      return `${h}:${mm} ${suffix}`;
    }
  }

  // Fallback: try to parse with Date
  const d = new Date(`1970-01-01T${s}`);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // As-is if unrecognized
  return s;
}

