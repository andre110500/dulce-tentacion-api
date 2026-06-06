require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URL;

const drinks = [
  { name: "Brahma 710", price: 3100, subType: "can" },
  { name: "Schneider 710", price: 3000, subType: "can" },
  { name: "Budweiser 710", price: 3400, subType: "can" },
  { name: "Brahma 473", price: 2100, subType: "can" },
  { name: "Smirlof rosado", price: 3200, subType: "can" },
  { name: "Smirlof verde", price: 3200, subType: "can" },

  { name: "Wisky criadores", price: 3000, subType: "small-bottle" },
  { name: "Café coñac", price: 3000, subType: "small-bottle" },

  { name: "Cosecha tardía", price: 5200, subType: "wine" },
  { name: "Viña del balbo", price: 3000, subType: "wine" },
  { name: "Santa Filomena", price: 3500, subType: "wine" },
  { name: "Viña de Alvear", price: 3100, subType: "wine" },

  { name: "Branca Litro", price: 25000, subType: "fernet" },
  { name: "Branca 3/4", price: 19000, subType: "fernet" },
  { name: "1882", price: 9500, subType: "fernet" },

  { name: "Café coñac cuseniers de litro", price: 7800, subType: "liqueur" },
  { name: "Gancia", price: 8000, subType: "liqueur" },
  { name: "SKY", price: 13000, subType: "liqueur" },
  { name: "Smirlof sav", price: 10500, subType: "liqueur" },
  { name: "Federico de Alvear", price: 5100, subType: "liqueur" },

  { name: "Baggio multifruta de litro", price: 2400, subType: "soft-drink" },
  { name: "Speed xl", price: 2700, subType: "soft-drink" },
  { name: "Coca 2.5l", price: 5000, subType: "soft-drink" },
  { name: "Coca 2.25l", price: 4800, subType: "soft-drink" },
  { name: "Sprite 1.75l", price: 4000, subType: "soft-drink" },
  { name: "Manaos 2.25l", price: 1800, subType: "soft-drink" },
  { name: "Placer 1.5l", price: 1300, subType: "soft-drink" },
];

async function seedDrinks() {
  if (!mongoDB) {
    throw new Error("Missing MONGODB_URI or DEV_DB_URL");
  }

  await mongoose.connect(mongoDB, { serverSelectionTimeoutMS: 5000 });

  const results = await Promise.all(
    drinks.map((drink) =>
      Product.updateOne(
        { name: drink.name, type: "drink", subType: drink.subType },
        {
          $set: {
            ...drink,
            type: "drink",
            outOfStock: false,
          },
        },
        { upsert: true, runValidators: true }
      )
    )
  );

  const created = results.filter((result) => result.upsertedCount > 0).length;
  const updated = results.length - created;

  console.log(`Drinks seeded: ${created} created, ${updated} updated.`);
}

seedDrinks()
  .catch((error) => {
    console.error(`Could not seed drinks: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
