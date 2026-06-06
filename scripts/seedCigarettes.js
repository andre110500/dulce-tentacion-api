require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URL;

const cigarettes = [
  { name: "Red point mentolado x20", price: 2500 },
  { name: "Red point comun x20", price: 2400 },
  { name: "Master x20", price: 2300 },
  { name: "Encendedor", price: 900 },
];

async function seedCigarettes() {
  if (!mongoDB) {
    throw new Error("Missing MONGODB_URI or DEV_DB_URL");
  }

  await mongoose.connect(mongoDB, { serverSelectionTimeoutMS: 5000 });

  const results = await Promise.all(
    cigarettes.map((cigarette) =>
      Product.updateOne(
        { name: cigarette.name, type: "cigarette" },
        {
          $set: {
            ...cigarette,
            type: "cigarette",
            outOfStock: false,
          },
          $unset: {
            subType: 1,
          },
        },
        { upsert: true, runValidators: true }
      )
    )
  );

  const created = results.filter((result) => result.upsertedCount > 0).length;
  const updated = results.length - created;

  console.log(`Cigarettes seeded: ${created} created, ${updated} updated.`);
}

seedCigarettes()
  .catch((error) => {
    console.error(`Could not seed cigarettes: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
