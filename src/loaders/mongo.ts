import mongoose, { Connection } from "mongoose";
import configs from "../configs";
import AutoJoinJobManager from "../api/game_week/utils/auto_join_job";
import NotificationJobManager from "../api/game_week/utils/notification_job";

export default (): Connection => {
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    retryWrites: true,
    w: 'majority' as const,
    maxPoolSize: 10,
    minPoolSize: 1,
  };

  mongoose
    .connect(configs.db.mongodb.remote, connectionOptions)
    .then(async () => {
      console.log(`MongoDB is successfully connected`);
      
      // Restore auto-join jobs after MongoDB is connected
      try {
        console.log(`🔄 Restoring auto-join jobs...`);
        await AutoJoinJobManager.rescheduleAllJobs();
        console.log(`✅ Auto-join jobs restored successfully`);
      } catch (error) {
        console.error(`❌ Failed to restore auto-join jobs:`, error);
      }

      // Restore notification jobs after MongoDB is connected
      try {
        console.log(`🔔 Restoring notification jobs...`);
        await NotificationJobManager.rescheduleAllNotificationJobs();
        console.log(`✅ Notification jobs restored successfully`);
      } catch (error) {
        console.error(`❌ Failed to restore notification jobs:`, error);
      }
    })
    .catch((err) => {
      console.error("MongoDB Connection Error:");
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      console.error("Full error:", err);
      
      if (err.message?.includes("IP") || err.message?.includes("whitelist")) {
        console.error("\n⚠️  IP Whitelist Issue Detected!");
        console.error("Please add your Render service IP to MongoDB Atlas Network Access.");
        console.error("Recommended: Add 0.0.0.0/0 to allow all IPs (for Render/cloud deployments).");
        console.error("MongoDB Atlas → Security → Network Access → Add IP Address");
      }
      
      process.exit(1);
    });

  const db = mongoose.connection;

  db.on("error", (err: Error) => {
    console.log(err);
  });

  db.on("disconnected", () => {
    console.log(`MongoDB disconnected`);
  });

  return db;
};
