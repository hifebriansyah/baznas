import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <StatusBadge status="diajukan" />
      <StatusBadge status="assessment" />
      <StatusBadge status="rekomendasi" />
      <StatusBadge status="ditolak_waka" />
      <StatusBadge status="acc" />
      <StatusBadge status="ditolak" />
      <StatusBadge status="selesai" />
    </div>
  ),
};

export const SmallSize: Story = {
  args: {
    status: "acc",
    size: "sm",
  },
};
