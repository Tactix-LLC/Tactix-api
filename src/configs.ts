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
  chapa: {
    secret_key: chapa_key,
  },
  email: {
    host: "smtp.gmail.com",
    port: 587, // Port 587 is more reliable on cloud platforms
    secure: false, // false for port 587 (uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  },
  google: {
    client_id: "545588730676-j8ubicjil67nigc71luslotbgk77ok94.apps.googleusercontent.com", // Android
    ios_client_id: "545588730676-cubab3ceuge681a5s1stjl30g8fd1lbt.apps.googleusercontent.com", // iOS
  },
  apple: {
    clientId: "app.jointactix.fantasy", // Your app's bundle ID
  },
  firebase: {
    projectId: "tactix-5f3c2",
    projectNumber: "545588730676",
    webApiKey: "AIzaSyCG5iWDEEd_irGZfaOphi_eLi6asysPUrg",
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY, // JSON string or path to file
  },
  api_url,
};
