import init from "./loaders";
const { redis_client } = init();

// Export redis client
export default {
  redis_client,
};
