export type Role = "amil" | "waka2" | "ketua";

export type PermohonanStatus =
  | "diajukan"
  | "assessment"
  | "rekomendasi"
  | "ditolak_waka"
  | "acc"
  | "ditolak"
  | "selesai";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export interface ModerasiEntry {
  id: number;
  role: "waka2" | "ketua";
  decision: "rekomendasi" | "acc" | "tolak";
  nominal: number | null;
  catatan: string | null;
  user_name: string;
  created_at: string;
}

export interface AttachmentItem {
  id: number;
  category: "assessment" | "penyaluran";
  kind: "dokumen" | "media";
  filename: string;
  mime: string;
  size: number;
  uploader_name: string | null;
  created_at: string;
}

export interface PermohonanListItem {
  id: number;
  no_register: string;
  tanggal: string;
  nama: string;
  nik: string;
  program: string;
  perihal: string;
  status: PermohonanStatus;
  nominal_rekomendasi: number | null;
  nominal_acc: number | null;
  jumlah_pm: number;
  created_at: string;
  updated_at: string;
}

export interface PermohonanDetail extends PermohonanListItem {
  mustahik_id: number;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  lembaga_referrer: string | null;
  pekerjaan: string;
  penghasilan: number;
  kontak: string;
  asnaf: string;
  catatan_assessment: string | null;
  jenis_dana: string | null;
  tanggal_penyaluran: string | null;
  moderasi: ModerasiEntry[];
  attachments: AttachmentItem[];
  can: {
    edit: boolean;
    assess: boolean;
    moderate: boolean;
    distribute: boolean;
  };
}

export interface MustahikItem {
  id: number;
  nik: string;
  nama: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  pekerjaan: string;
  penghasilan: number;
  kontak: string;
  asnaf: string;
  source: "manual" | "permohonan";
  created_at: string;
  permohonan_count?: number;
}

export interface MustahikDetail extends MustahikItem {
  permohonan: PermohonanListItem[];
}

export interface MetaResponse {
  roles: Record<Role, string>;
  status: Record<PermohonanStatus, string>;
  asnaf: string[];
  program: string[];
  jenis_dana: string[];
  jenis_kelamin: string[];
  suggestions: {
    kecamatan: string[];
    kelurahan: string[];
    lembaga_referrer: string[];
    pekerjaan: string[];
  };
}

export interface DashboardResponse {
  by_status: Record<string, number>;
  totals: {
    n: number;
    disetujui: number;
    disalurkan: number;
    penerima: number;
    mustahik: number;
  };
  by_program: Array<{
    program: string;
    n: number;
    nominal: number;
  }>;
  recent: PermohonanListItem[];
  inbox: {
    statuses: PermohonanStatus[];
    count: number;
    items: PermohonanListItem[];
  };
}
