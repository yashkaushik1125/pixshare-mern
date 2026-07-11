// Seeds demo users and starter images. Safe to re-run: it clears existing data.
//   npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Image } from "./models/Image.js";
import { Listing } from "./models/Listing.js";

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
  // Create broker users and listings
  await Listing.deleteMany({});

  const BROKER_COUNT = 10;
  const LISTINGS_PER_BROKER = 5;

  const sampleImages = [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200",
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200",
  ];

  const cities = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai", "Delhi", "Kolkata"];

  for (let i = 1; i <= BROKER_COUNT; i++) {
    const email = `broker${i}@demo.app`;
    const name = `Broker ${i}`;
    const passwordHash = await User.hashPassword("broker123");
    const broker = await User.create({ name, email, passwordHash, role: "editor" });

    for (let j = 0; j < LISTINGS_PER_BROKER; j++) {
      const idx = (i * j) % sampleImages.length;
      const title = j % 3 === 0 ? `Villa ${i}-${j}` : j % 3 === 1 ? `Apartment ${i}-${j}` : `Land Plot ${i}-${j}`;
      const price = j % 3 === 0 ? `₹${(80 + i * 5 + j) } Lakh` : j % 3 === 1 ? `₹${(60 + i * 4 + j)} Lakh` : `₹${(20 + i * 10 + j)} Lakh`;
      const location = `${cities[(i + j) % cities.length]}`;
      const specs = j % 3 === 0 ? `${2 + (j % 3)} BHK • ${900 + j * 120} sqft` : j % 3 === 1 ? `${1 + (j % 2)} BHK • ${600 + j * 80} sqft` : `${2000 + j * 300} sqft plot`;
      const description = `Attractive ${title} in ${location}. Well-located, recently inspected, and ready for visits.`;
      const trustScore = 88 + Math.floor(Math.random() * 13); // 88..100
      await Listing.create({
        title,
        price,
        location,
        specs,
        description,
        imageUrl: sampleImages[idx],
        broker: broker._id,
        brokerName: broker.name,
        trustScore,
      });
    }
  }

  console.log(`  Seeded ${BROKER_COUNT} brokers and ${BROKER_COUNT * LISTINGS_PER_BROKER} listings.`);
  // Backfill any existing listings that lack a trustScore
  const missing = await Listing.find({ trustScore: { $exists: false } });
  for (const l of missing) {
    l.trustScore = 88 + Math.floor(Math.random() * 13);
    await l.save();
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
