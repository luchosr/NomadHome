import { createApp } from "./app.js";

// const PORT = Number(process.env.PORT ?? 3000);
const PORT = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.info(`[api] NomadHome API listening  on port ${PORT}`);
});
