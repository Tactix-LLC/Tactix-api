import http from "http";
import cluster from "cluster";
import os from "os";
import app from "./server";
import mongo from "./mongo";
import RedisClient from "./redis";
import { RedisClientType } from "redis";

const CPUS = os.cpus().length;

export default () => {
  // if (cluster.isPrimary) {
  //   // Fork
  //   console.log(os.cpus());
  //   for (let i = 0; i < CPUS; i++) {
  //     console.log("!!!!!!!!!!!!!!!!!!!!!########");
  //     cluster.fork();
  //   }

  //   // Exit
  //   cluster.on("exit", (worker, code, signal) => {
  //     console.log(`Worker ${worker.process.pid} died`);
  //     cluster.fork();
  //   });
  // } else {
  //   const server = http.createServer(app);
  //   const port = (process.env.PORT as unknown as number) || 3000;
  //   server.listen(port, () => {
  //     console.log(`Listening on ${port}...`);
  //   });

  //   process.on("SIGINT", () => {
  //     console.log("Server closing");
  //     server.close();
  //   });
  // }

  const server = http.createServer(app);
  const port = (process.env.PORT as unknown as number) || 3000;
  server.listen(port, () => {
    console.log(`Listening on ${port}...`);
  });

  process.on("SIGINT", () => {
    console.log("Server closing");
    server.close();
  });

  // MongoDB
  const mongo_db = mongo();

  // Redis
  const redis_client: RedisClientType = RedisClient.start();

  // Majestic Close
  process.on("SIGINT", async () => {
    redis_client.quit().catch((error) => {
      console.log("DB is closed");
    });
    mongo_db.close();
  });

  return { redis_client, mongo_db };
};
