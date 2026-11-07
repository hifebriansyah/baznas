import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ModerationModal } from "./ModerationModal";

const meta: Meta<typeof ModerationModal> = {
  title: "Components/ModerationModal",
  component: ModerationModal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ModerationModal>;

export const RekomendasiWaka2: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white"
        >
          Buka Modal Rekomendasi Waka II
        </button>
        <ModerationModal
          open={open}
          onClose={() => setOpen(false)}
          role="waka2"
          decision="rekomendasi"
          defaultNominal={60000000}
          onSubmit={async () => {}}
        />
      </div>
    );
  },
};

export const AccKetua: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white"
        >
          Buka Modal ACC Ketua
        </button>
        <ModerationModal
          open={open}
          onClose={() => setOpen(false)}
          role="ketua"
          decision="acc"
          defaultNominal={60000000}
          onSubmit={async () => {}}
        />
      </div>
    );
  },
};

export const PenolakanPimpinan: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white"
        >
          Buka Modal Tolak
        </button>
        <ModerationModal
          open={open}
          onClose={() => setOpen(false)}
          role="ketua"
          decision="tolak"
          onSubmit={async () => {}}
        />
      </div>
    );
  },
};
