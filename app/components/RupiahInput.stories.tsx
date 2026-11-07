import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RupiahInput } from "./RupiahInput";
import { formatRupiah } from "~/lib/format";

const meta: Meta<typeof RupiahInput> = {
  title: "Components/RupiahInput",
  component: RupiahInput,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RupiahInput>;

export const Interactive: Story = {
  render: () => {
    const [val, setVal] = useState(60000000);
    return (
      <div className="max-w-sm space-y-2 p-4">
        <label className="block text-xs font-bold text-slate-700 uppercase">
          Nominal Rekomendasi / ACC
        </label>
        <RupiahInput value={val} onChange={setVal} />
        <p className="text-xs text-slate-500">Terformat: {formatRupiah(val)}</p>
      </div>
    );
  },
};
