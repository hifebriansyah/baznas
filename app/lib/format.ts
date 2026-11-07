const ID_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
  return `Rp. ${formatted},-`;
}

export function formatDateId(dateStr: string | null | undefined): string {
  if (!dateStr) return "(belum ada)";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const mIdx = Number(month) - 1;
  const monthName = ID_MONTHS[mIdx] || month;
  return `${Number(day)} ${monthName} ${year}`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatDateTimeWib(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  // Convert to WIB (UTC+7)
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = wib.getUTCDate();
  const month = ID_MONTHS[wib.getUTCMonth()];
  const year = wib.getUTCFullYear();
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  const ss = String(wib.getUTCSeconds()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hh}:${mm}:${ss} WIB`;
}

export function calculateAge(birthDateStr: string | null | undefined): number | null {
  if (!birthDateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDateStr);
  if (!match) return null;
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const mDiff = now.getMonth() + 1 - birthMonth;
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDay)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
