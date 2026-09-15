import { siteConfig } from "@/lib/site-config";

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toNepaliDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}

const NE_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const NE_MONTHS = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
];

/** Current date/time in Nepal (Asia/Kathmandu), computed at call time — never hardcoded. */
export function getNepalNow(): Date {
  const nepalString = new Date().toLocaleString("en-US", { timeZone: siteConfig.timezone });
  return new Date(nepalString);
}

/** e.g. "शुक्रबार, १४ अगस्ट २०२६" */
export function formatNepaliDateLong(date: Date): string {
  const weekday = NE_WEEKDAYS[date.getDay()];
  const day = toNepaliDigits(String(date.getDate()));
  const month = NE_MONTHS[date.getMonth()];
  const year = toNepaliDigits(String(date.getFullYear()));
  return `${weekday}, ${day} ${month} ${year}`;
}

/** e.g. "बिहान ६:१५" / "साँझ ७:४०" */
export function formatNepaliTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "बिहान" : hours < 17 ? "दिउँसो" : hours < 20 ? "साँझ" : "राति";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = toNepaliDigits(String(minutes).padStart(2, "0"));
  return `${period} ${toNepaliDigits(String(hours))}:${mm}`;
}

/** e.g. "१४ अगस्ट, बिहान ६:१५" — used for the "updated" indicator and article timestamps. */
export function formatNepaliDateTime(iso: string): string {
  const date = new Date(iso);
  const day = toNepaliDigits(String(date.getDate()));
  const month = NE_MONTHS[date.getMonth()];
  return `${day} ${month}, ${formatNepaliTime(date)}`;
}

export function formatNepaliRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = getNepalNow().getTime();
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "अहिले";
  if (diffMin < 60) return `${toNepaliDigits(String(diffMin))} मिनेट अगाडि`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${toNepaliDigits(String(diffHour))} घण्टा अगाडि`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${toNepaliDigits(String(diffDay))} दिन अगाडि`;
  return formatNepaliDateTime(iso);
}
