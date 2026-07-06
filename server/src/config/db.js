import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("  MongoDB connected:", mongoose.connection.name);

  mongoose.connection.on("error", (err) => {
    console.error("  MongoDB error:", err.message);
  });
}
