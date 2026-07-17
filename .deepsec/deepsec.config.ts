import { defineConfig } from "deepsec/config";

export default defineConfig({
  defaultAgent: "claude",
  projects: [
    { id: "NomadHome", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
