import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), "./src/config.env"), debug: true });

// Check the env
let api_url = process.env.API_URL_DEV_LOCAL;
let chapa_key = process.env.CHAPA_TEST_SECRET_KEY;
if (process.env.NODE_ENV === "development") {
  api_url = process.env.API_URL_DEV_REMOTE;
} else if (process.env.NODE_ENV === "local") {
  api_url = process.env.API_URL_DEV_LOCAL;
} else if (process.env.NODE_ENV === "qa") {
  api_url = process.env.API_URL_QA_REMOTE;
  chapa_key = process.env.CHAPA_SECRET_KEY;
} else {
  api_url = process.env.API_URL_REMOTE;
  chapa_key = process.env.CHAPA_SECRET_KEY;
}

export default {
  env: <string>process.env.NODE_ENV,
  db: {
    mongodb: {
      remote: <string>process.env.MONGO_DB_REMOTE,
      local: <string>process.env.MONGO_DB_LOCAL,
    },
    redis: {
      local: <string>process.env.REDIS_LOCAL,
      remote: <string>process.env.REDIS_REMOTE,
    },
  },
  jwt: {
    secret: <string>process.env.JWT_SECRET,
    expires_in: <string>process.env.JWT_EXPIRES_IN,
  },
  delete_key: <string>process.env.DELETE_KEY,
  api_key: <string>process.env.API_KEY,
  cloudinary: {
    cloud_name: <string>process.env.CLOUDINARY_CLOUD_NAME,
    api_key: <string>process.env.CLOUDINARY_API_KEY,
    api_secret: <string>process.env.CLOUDINARY_API_SECRET,
  },
  entity_sport: {
    url: process.env.ENTITY_SPORT_URL,
    token: process.env.ENTITY_SPORT_TOKEN,
  },
  afro: {
    sender_name: process.env.AFRO_SENDER_NAME,
    api_key: process.env.AFRO_API_KEY,
    identifier: process.env.AFRO_IDENTIFIER,
  },
  chapa: {
    secret_key: chapa_key,
  },
  api_url,
};
