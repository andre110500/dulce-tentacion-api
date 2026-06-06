const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  imgUrl: { type: String, required: false },
  flavours: { type: Number, required: false },
  outOfStock: { type: Boolean, required: false },
  price: { type: Number, required: true },
  description: { type: String, required: false },
  apiRoute: { type: String, required: false },
  type: {
    type: String,
    enum: ["frozen-treat", "ice-cream", "add-on","drink","cigarette"],
    required: true,
  },
  subType: {
    type: String,
    enum: [
       "can",
    "small-bottle",
    "wine",
    "fernet",
    "liqueur",
    "soft-drink",
  ],
    required: false,
  },
});

// Export model
module.exports = mongoose.model("Product", ProductSchema);
