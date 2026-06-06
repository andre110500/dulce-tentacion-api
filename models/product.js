const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SUB_TYPES_BY_TYPE = {
  drink: ["can", "small-bottle", "wine", "fernet", "liqueur", "soft-drink"],
  "frozen-treat": ["tub", "popsicle", "dessert", "cone"],
  "add-on": ["pot-topping", "wafer-cone"],
};

const getProductTypeFromValidatorContext = (context) => {
  const update = context.getUpdate?.();

  return (
    context.type ||
    context.get?.("type") ||
    update?.type ||
    update?.$set?.type
  );
};

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
    enum: ["frozen-treat", "ice-cream", "add-on", "drink", "cigarette"],
    required: true,
  },
  subType: {
    type: String,
    required: false,
    validate: {
      validator: function (value) {
        const productType = getProductTypeFromValidatorContext(this);
        const allowedSubTypes = SUB_TYPES_BY_TYPE[productType];

        if (!value) {
          return true;
        }

        return Boolean(allowedSubTypes) && allowedSubTypes.includes(value);
      },
      message: "subType is not valid for this product type",
    },
  },
});

const Product = mongoose.model("Product", ProductSchema);

Product.SUB_TYPES_BY_TYPE = SUB_TYPES_BY_TYPE;

// Export model
module.exports = Product;
