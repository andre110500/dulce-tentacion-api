const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const he = require("he");

// Normaliza valores de texto que llegan del body: recorta espacios, decodifica HTML
// y convierte strings vacios en undefined para que Mongoose aplique la logica del schema.
const decodeString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? he.decode(trimmedValue) : undefined;
};

// Centraliza que campos del request pueden crear/actualizar un producto.
// Asi el controller prepara datos limpios, pero las reglas de required, enum y tipos quedan en el modelo.
const getProductData = (body) => ({
  name: decodeString(body.name),
  price: decodeString(body.price),
  imgUrl: decodeString(body.imgUrl),
  outOfStock: decodeString(body.outOfStock),
  description: decodeString(body.description),
  flavours: decodeString(body.flavours),
  apiRoute: decodeString(body.apiRoute),
  type: decodeString(body.type),
  subType: decodeString(body.subType),
});

// Convierte errores de Mongoose a un formato simple para que el frontend pueda mostrar
// que campo fallo, cual fue el mensaje y que valor se recibio.
const formatMongooseErrors = (error) => {
  if (error.name === "ValidationError") {
    return Object.values(error.errors).map((validationError) => ({
      field: validationError.path,
      message: validationError.message,
      value: validationError.value,
    }));
  }

  if (error.name === "CastError") {
    return [
      {
        field: error.path,
        message: error.message,
        value: error.value,
      },
    ];
  }

  return null;
};

exports.product_create = [
  async (req, res, next) => {
    // El producto se crea con datos normalizados; al guardar, Mongoose valida segun ProductSchema.
    const product = new Product(getProductData(req.body));

    try {
      jwt.verify(req.token, "secretkey");
      await product.save();
      res.status(200).json({ product });
    } catch (err) {
      console.log(err);
      const validationErrors = formatMongooseErrors(err);

      if (validationErrors) {
        return res.status(422).json({
          error: "Schema validation failed",
          errors: validationErrors,
        });
      }

      res
        .status(500)
        .json({ message: "Something went wrong", error: err.message });
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
  async (req, res, next) => {
    // Reutilizamos la misma preparacion de datos que en create para mantener ambos flujos alineados.
    const productData = getProductData(req.body);
    const updatedProduct = new Product({
      ...productData,
      _id: req.params.id,
    });

    console.log(`updated product ${updatedProduct}  `);

    try {
      jwt.verify(req.token, "secretkey");
      // Validamos una instancia completa para respetar los required del schema antes de actualizar.
      await updatedProduct.validate();
      await Product.findByIdAndUpdate(req.params.id, productData, {
        // Mongoose tambien valida el update, asi cambios futuros del schema aplican automaticamente.
        runValidators: true,
      });
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
      const validationErrors = formatMongooseErrors(error);

      if (validationErrors) {
        return res.status(422).json({
          error: "Schema validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({ error: error });
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
