// Seeds demo users and starter images. Safe to re-run: it clears existing data.
//   npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Image } from "./models/Image.js";

const DEMO_USERS = [
  { name: "Ava Admin", email: "admin@demo.app", password: "admin123", role: "admin" },
  { name: "Eddie Editor", email: "editor@demo.app", password: "editor123", role: "editor" },
  { name: "Vicky Viewer", email: "viewer@demo.app", password: "viewer123", role: "viewer" },
];

const DEMO_IMAGES = [
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900", caption: "Golden hour over the lake", author: "editor@demo.app" },
  { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900", caption: "Mountains painted in light", author: "admin@demo.app" },
  { url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=900", caption: "Quiet valley morning", author: "editor@demo.app" },
  { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900", caption: "Where the path leads", author: "admin@demo.app" },
];

async function run() {
  await connectDB(process.env.MONGODB_URI);

  await User.deleteMany({});
  await Image.deleteMany({});

  const byEmail = {};
  for (const u of DEMO_USERS) {
    const passwordHash = await User.hashPassword(u.password);
    const doc = await User.create({ name: u.name, email: u.email, passwordHash, role: u.role });
    byEmail[u.email] = doc;
  }

  for (const img of DEMO_IMAGES) {
    const author = byEmail[img.author];
    await Image.create({
      url: img.url,
      caption: img.caption,
      author: author._id,
      authorName: author.name,
      likedBy: [],
    });
  }

  console.log("  Seeded", DEMO_USERS.length, "users and", DEMO_IMAGES.length, "images.");
  console.log("  Logins: admin@demo.app/admin123, editor@demo.app/editor123, viewer@demo.app/viewer123");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
