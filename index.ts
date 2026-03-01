import { createServer } from "./instance/server"
import env from "./instance/env";
import { config } from "dotenv"

config({
  path: `.env.${env.NODE_ENV}`,
  quiet: true,
})

console.log(env)

const host = env.HOST;
const port = env.PORT;

async function bootstrap() {
  const server = await createServer()
  await server.listen({ host, port })

  process.on("SIGINT", () => {
    console.log("\nShutting down...\n");
    server.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down...\n");
    server.close();
    process.exit(0);
  });

  server.log.info(`server is running on: http://${host}:${port}`,);

}


bootstrap().catch((err) => {
  console.log("failed to boot server ", err)
  process.exit(1)
})
