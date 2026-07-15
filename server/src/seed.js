// Seeds demo users and starter images/listings. Safe to re-run: it clears
// existing data.
//   npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Image } from "./models/Image.js";
import { Listing, LISTING_CATEGORIES } from "./models/Listing.js";

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

// City -> state map (state is public alongside the city).
const CITY_STATE = {
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  Bangalore: "Karnataka",
  Hyderabad: "Telangana",
  Chennai: "Tamil Nadu",
  Delhi: "Delhi",
  Kolkata: "West Bengal",
};

const CATEGORY_LABEL = {
  villa: "Villa",
  flat: "Flat",
  bunglow: "Bungalow",
  farm: "Farmhouse",
};

const STREETS = ["MG Road", "Park Street", "Lake View Avenue", "Hill Crest Road", "Green Enclave", "Palm Grove"];

const AMENITIES_POOL = [
  "Covered Parking",
  "Gymnasium",
  "Swimming Pool",
  "Power Backup",
  "Lift",
  "Club House",
  "24x7 Security",
  "Landscaped Garden",
  "Kids Play Area",
  "Rainwater Harvesting",
];

const SAMPLE_IMAGES = [
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

// Deterministic amenity selection so re-seeding is stable.
function pickAmenities(seed) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    out.push(AMENITIES_POOL[(seed + k * 3) % AMENITIES_POOL.length]);
  }
  return [...new Set(out)];
}

function buildListing(i, j) {
  const category = LISTING_CATEGORIES[(i + j) % LISTING_CATEGORIES.length];
  const cityNames = Object.keys(CITY_STATE);
  const city = cityNames[(i + j) % cityNames.length];
  const state = CITY_STATE[city];
  const isLand = category === "farm";

  const bhk = isLand ? 0 : 2 + ((i + j) % 3); // 2..4
  const size =
    category === "villa"
      ? 2000 + j * 250
      : category === "flat"
      ? 900 + j * 120
      : category === "bunglow"
      ? 2600 + j * 300
      : 5000 + j * 750; // farm

  // Villas & bungalows priced in crores, flats & farms in lakhs.
  const inCrore = category === "villa" || category === "bunglow";
  const priceUnit = inCrore ? "crore" : "lakh";
  const priceAmount = inCrore
    ? Number((1 + ((i + j) % 5) * 0.4).toFixed(1)) // 1.0 .. 2.6 Cr
    : 40 + i * 3 + j * 5; // 40 .. ~115 Lakh

  const idx = (i * 3 + j) % SAMPLE_IMAGES.length;
  const images = [
    SAMPLE_IMAGES[idx],
    SAMPLE_IMAGES[(idx + 1) % SAMPLE_IMAGES.length],
    SAMPLE_IMAGES[(idx + 2) % SAMPLE_IMAGES.length],
  ];

  const label = CATEGORY_LABEL[category];
  const title = `${label} in ${city}`;
  const street = STREETS[(i + j) % STREETS.length];
  const address = `${100 + i * 7 + j}, ${street}, ${city}, ${state}`;
  const description = `Well-maintained ${label.toLowerCase()} located in ${city}, ${state}. ${
    isLand ? "Clear title, ready for development." : `${bhk} BHK with ${size} sqft of space.`
  } Recently inspected and ready for site visits.`;

  const trustScore = 88 + ((i * 5 + j * 3) % 13); // 88..100, deterministic

  return {
    title,
    category,
    size,
    bhk,
    priceAmount,
    priceUnit,
    address,
    city,
    state,
    description,
    images,
    amenities: pickAmenities(i + j),
    trustScore,
  };
}

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

  // Create broker users and listings.
  await Listing.deleteMany({});

  const BROKER_COUNT = 10;
  const LISTINGS_PER_BROKER = 6;

  for (let i = 1; i <= BROKER_COUNT; i++) {
    const email = `broker${i}@demo.app`;
    const name = `Broker ${i}`;
    const passwordHash = await User.hashPassword("broker123");
    const broker = await User.create({ name, email, passwordHash, role: "editor" });

    for (let j = 0; j < LISTINGS_PER_BROKER; j++) {
      const data = buildListing(i, j);
      await Listing.create({ ...data, broker: broker._id, brokerName: broker.name });
    }
  }

  console.log(`  Seeded ${BROKER_COUNT} brokers and ${BROKER_COUNT * LISTINGS_PER_BROKER} listings.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
