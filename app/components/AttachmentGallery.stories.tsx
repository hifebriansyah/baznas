import type { Meta, StoryObj } from "@storybook/react-vite";
import { AttachmentGallery } from "./AttachmentGallery";
import type { AttachmentItem } from "~/lib/types";

const SAMPLE_ITEMS: AttachmentItem[] = [
  {
    id: 1,
    category: "assessment",
    kind: "dokumen",
    filename: "Surat_Keterangan_Tidak_Mampu.pdf",
    mime: "application/pdf",
    size: 184320,
    uploader_name: "Ahmad Fauzi",
    created_at: "2026-09-14T02:15:00Z",
  },
  {
    id: 2,
    category: "assessment",
    kind: "dokumen",
    filename: "RAB_Usaha_Bakso.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 94210,
    uploader_name: "Ahmad Fauzi",
    created_at: "2026-09-14T02:18:00Z",
  },
  {
    id: 3,
    category: "assessment",
    kind: "media",
    filename: "Foto_Survei_Rumah_1.jpg",
    mime: "image/jpeg",
    size: 412900,
    uploader_name: "Ahmad Fauzi",
    created_at: "2026-09-14T02:20:00Z",
  },
  {
    id: 4,
    category: "assessment",
    kind: "media",
    filename: "Foto_Gerobak_Usaha.jpg",
    mime: "image/jpeg",
    size: 389120,
    uploader_name: "Ahmad Fauzi",
    created_at: "2026-09-14T02:21:00Z",
  },
];

const meta: Meta<typeof AttachmentGallery> = {
  title: "Components/AttachmentGallery",
  component: AttachmentGallery,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AttachmentGallery>;

export const EditableAmilView: Story = {
  args: {
    permohonanId: 1,
    category: "assessment",
    attachments: SAMPLE_ITEMS,
    canEdit: true,
    onChanged: () => {},
  },
};

export const ReadOnlyModeratorView: Story = {
  args: {
    permohonanId: 1,
    category: "assessment",
    attachments: SAMPLE_ITEMS,
    canEdit: false,
    onChanged: () => {},
  },
};
