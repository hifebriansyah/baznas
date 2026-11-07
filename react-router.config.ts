import type { Config } from "@react-router/dev/config";
import { basePath } from "./scripts/base-path.ts";

export default {
  ssr: false,
  basename: basePath(),
} satisfies Config;
