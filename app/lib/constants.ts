export const ASNAF_OPTIONS = [
  "Fakir",
  "Miskin",
  "Amil",
  "Mualaf",
  "Riqab",
  "Gharim",
  "Fisabilillah",
  "Ibnu Sabil",
] as const;

export const PROGRAM_OPTIONS = [
  "Cianjur Makmur",
  "Cianjur Takwa",
  "Cianjur Cerdas",
  "Cianjur Sehat",
  "Cianjur Peduli",
] as const;

export const JENIS_DANA_OPTIONS = [
  "Zakat",
  "Infak Terikat",
  "Infak Tidak Terikat",
  "Dana Sosial Keagamaan Lainnya",
  "CSR",
] as const;

export const JENIS_KELAMIN_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export const STATUS_LABELS: Record<string, string> = {
  diajukan: "Diajukan",
  assessment: "Assessment",
  rekomendasi: "ACC Wakil Ketua",
  ditolak_waka: "Ditolak Wakil Ketua",
  acc: "ACC Ketua",
  ditolak: "Ditolak",
  selesai: "Selesai",
};

export const ROLE_LABELS: Record<string, string> = {
  amil: "Amil Pelaksana",
  waka2: "Wakil Ketua II",
  ketua: "Ketua BAZNAS",
};
