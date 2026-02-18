const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const he = require("he");

// Common validation for product fields
const validation = [
  body("name", "name must be specified").trim().isLength({ min: 1 }).escape(),
  body("apiUrl")
    .optional()
    .isString()
    .trim()
    .escape()
    .withMessage("apiUrl must be a string value and at least 1 character long"),
  body("price", "price must be specified").trim().escape().isNumeric(),
  body("imgUrl", "imgUrl must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("outOfStock")
    .optional()
    .trim()
    .escape()
    .isBoolean()
    .withMessage("outOfStock must be a boolean value"),
  body("flavours")
    .optional()
    .trim()
    .escape()
    .isNumeric()
    .withMessage("Flavours must be a valid number"),
  body("description").optional().trim().escape(),
];

exports.product_create = [
  ...validation, // Spread the common validation array

  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.git

    const product = new Product({
      name: he.decode(req.body.name),
      price: req.body.price,
      imgUrl: he.decode(req.body.imgUrl),
      outOfStock: req.body.outOfStock,
      description: req.body.description,
      flavours: req.body.flavours,
      apiRoute: req.body.apiRoute,
      type: req.body.type,
    });

    if (!errors.isEmpty()) {
      // There are errors.

      res.status(422).json({ error: "Body validation failed" });
      return;
    } else {
      try {
        // Data from form is valid
        jwt.verify(req.token, "secretkey");
        await product.save();
        res.status(200).json({ product });
      } catch (err) {
        console.log(err);
        // Check if it's a validation error from Mongoose
        if (err.name === "ValidationError") {
          return res.status(422).json({ error: "Schema validation Failed" });
        }

        // For other errors, return a generic error message
        res
          .status(500)
          .json({ message: "Something went wrong", error: err.message });
      }
    }
  },
];

exports.product_list = asyncHandler(async (req, res, next) => {
  const { type } = req.query;

  let filter = {};

  if (type) {
    if (Array.isArray(type)) {
      // Caso ?type=addon&type=sauses
      filter.type = { $in: type };
    } else {
      // Caso ?type=addon
      filter.type = type;
    }
  }

  const products = await Product.find(filter)
    .sort({ price: -1 })
    .exec();

  res.json(products);
});



exports.product_schema = asyncHandler(async (req, res, next) => {
  //
  const schema = Product.schema.paths;
  const schemaDetails = Object.keys(schema)
    .filter((key) => !key.startsWith("_")) // Filter out keys starting with '_'
    .map((key) => {
      return {
        key: key,
        type: schema[key].instance,
        required: schema[key].isRequired ? true : false,
      };
    });
  console.log(`schema is ${JSON.stringify(schemaDetails)}`);
  //
  res.json(schemaDetails);
});

exports.product_update = [
  ...validation, // Spread the common validation array
  async (req, res, next) => {
    const updatedProduct = new Product({
      name: he.decode(req.body.name),
      price: req.body.price,
      imgUrl: he.decode(req.body.imgUrl),
      description: req.body.description,
      outOfStock: req.body.outOfStock,
      flavours: req.body.flavours,
      apiRoute: req.body.apiRoute,
      type: req.body.type,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    console.log(`updated product ${updatedProduct}  `);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ error: "Validation failed" });
    } else {
      try {
        jwt.verify(req.token, "secretkey");
        await Product.findByIdAndUpdate(req.params.id, updatedProduct, {});
        //delte missing flavours field
        if (!updatedProduct.flavours) {
          await Product.findByIdAndUpdate(
            req.params.id,
            { $unset: { flavours: 1 } },
            {}
          );
        }
        res.status(200).json({});
      } catch (error) {
        console.log("Error occurred bro:", error);
        res.status(500).json({ error: error });
      }
    }
  },
];

exports.product_delete = [
  async (req, res, next) => {
    try {
      //if v erification vails , an error will be thrown
      jwt.verify(req.token, "secretkey");
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "product deleted" });
    } catch (error) {
      console.log(`error : ${error}`);
      next(error);
    }
  },
];
