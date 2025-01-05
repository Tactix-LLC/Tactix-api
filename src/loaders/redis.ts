import { RedisClientType, createClient } from "redis";
import configs from "../configs";

export default class RedisClient {
  private static redis_client: RedisClientType;

  static start(): RedisClientType {
    // Create client
    const client: RedisClientType = createClient({
      url: configs.db.redis.remote,
    });

    // Connect to Redis Server
    client
      .connect()
      .then((conn) => {
        console.log(`Redis is successfully connected`);
      })
      .catch((error) => {
        console.log(`Error`);
        console.log(error);
        process.exit(1);
      });

    // Handle Redis client events
    client.on("error", (error) => {
      console.log(`Error`);
      console.log(error);
      process.exit(1);
    });

    client.on("disconnect", () => {
      console.log("Redis is disconnected");
    });

    return client;
  }
}
