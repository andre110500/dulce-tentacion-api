var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var usersRouter = require("./routes/users");
var productsRouter = require(`./routes/products`);

var genericRouter = require(`./routes/generic`);
const cors = require("cors");
var app = express();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URL;
console.log(mongoDB);

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
  console.log("connected to mongoDB");
}

// view engine setup
/* app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade"); */

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
/* app.use(express.static(path.join(__dirname, "public"))); */

const allowedOrigins =
  process.env.CLIENTSCORS_ALLOWED_ORIGINS?.split(",") ||
  process.env.DEV_CORS_ALLOWED_ORIGINS.split(",");
console.log(allowedOrigins);
app.use(
  cors({
    origin: allowedOrigins,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // maximum of 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use("/generic", genericRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
