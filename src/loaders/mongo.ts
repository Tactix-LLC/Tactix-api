import mongoose, { Connection } from "mongoose";
import configs from "../configs";

export default (): Connection => {
  mongoose
    .connect(configs.db.mongodb.remote)
    .then(() => {
      console.log(`MongoDB is successfully connected`);
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
