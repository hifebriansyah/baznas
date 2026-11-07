import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof AppShell> = {
  title: "Components/AppShell",
  component: AppShell,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AppShell>;

export const DefaultLayout: Story = {
  render: () => (
    <AppShell
      title="Detail Permohonan"
      subtitle="No. Register 2026-00001 • Asep Sunandar"
      actions={<StatusBadge status="assessment" />}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Konten Halaman Utama</h2>
        <p className="mt-1 text-xs text-slate-500">
          Sidebar kiri menampilkan menu Dashboard, Permohonan, Mustahik, dan pengalih peran (POV).
        </p>
      </div>
    </AppShell>
  ),
};
