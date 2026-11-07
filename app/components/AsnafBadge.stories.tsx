import type { Meta, StoryObj } from "@storybook/react-vite";
import { AsnafBadge } from "./AsnafBadge";
import { ASNAF_OPTIONS } from "~/lib/constants";

const meta: Meta<typeof AsnafBadge> = {
  title: "Components/AsnafBadge",
  component: AsnafBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AsnafBadge>;

export const DelapanAsnaf: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2.5 p-4">
      {ASNAF_OPTIONS.map((a) => (
        <AsnafBadge key={a} asnaf={a} />
      ))}
    </div>
  ),
};
