import { Options } from "twind_fresh_plugin/twind.ts";
import { defineConfig } from "twind";
import presetTailWind from "twind-preset-tailwind";

export default {
  ...defineConfig({
    presets: [presetTailWind()],
  }),
  selfURL: import.meta.url,
} as Options;
