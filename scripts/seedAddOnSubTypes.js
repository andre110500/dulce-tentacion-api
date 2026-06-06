require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URL;

const addOnSubTypes = [
  {
    subType: "pot-topping",
    names: ["Rocklets", "Salsa"],
  },
  {
    subType: "wafer-cone",
    names: ["Cono de oblea", "Cucurucho chico", "Cucurucho grande"],
  },
];

async function seedAddOnSubTypes() {
  if (!mongoDB) {
    throw new Error("Missing MONGODB_URI or DEV_DB_URL");
  }

  await mongoose.connect(mongoDB, { serverSelectionTimeoutMS: 5000 });

  const results = await Promise.all(
    addOnSubTypes.map(({ subType, names }) =>
      Product.updateMany(
        { type: "add-on", name: { $in: names } },
        {
          $set: {
            type: "add-on",
            subType,
          },
        },
        { runValidators: true }
      )
    )
  );

  const modified = results.reduce(
    (total, result) => total + result.modifiedCount,
    0
  );
  const matched = results.reduce((total, result) => total + result.matchedCount, 0);

  console.log(`Add-on subTypes seeded: ${matched} matched, ${modified} modified.`);
}

seedAddOnSubTypes()
  .catch((error) => {
    console.error(`Could not seed add-on subTypes: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
