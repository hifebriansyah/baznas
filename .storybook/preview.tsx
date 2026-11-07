import type { Decorator, Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import "../app/styles/app.css";

const withRouter: Decorator = (Story) => (
  <MemoryRouter>
    <div className="min-h-[240px] bg-slate-50 p-6 text-slate-900">
      <Story />
    </div>
  </MemoryRouter>
);

const preview: Preview = {
  decorators: [withRouter],
  parameters: {
    backgrounds: { disable: true },
    layout: "fullscreen",
    a11y: { test: "todo" },
  },
};

export default preview;
