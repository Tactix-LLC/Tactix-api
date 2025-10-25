import mongoose, { Connection } from "mongoose";
import configs from "../configs";
import AutoJoinJobManager from "../api/game_week/utils/auto_join_job";
import NotificationJobManager from "../api/game_week/utils/notification_job";

export default (): Connection => {
  mongoose
    .connect(configs.db.mongodb.remote)
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
      console.log("Error");
      console.log(err);
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
