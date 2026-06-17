import { serve } from "@hono/node-server";
import { createRuntimeDependencies } from "./server/runtime.js";
import { createApiApp } from "./server/app.js";

const dependencies = createRuntimeDependencies();
const app = createApiApp(dependencies);
const port = dependencies.config.port;

serve(
  {
    fetch: app.fetch,
    hostname: dependencies.config.host,
    port,
  },
  () => {
    dependencies.logger.info({ host: dependencies.config.host, port }, "Codex Reviewer API listening");
  },
);
