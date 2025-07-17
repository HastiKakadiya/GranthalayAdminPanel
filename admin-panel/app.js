require("dotenv").config();
// for test
var createError = require("http-errors");
var express = require("express");
var path = require("path");
const fs = require('fs');
const PDFDocument = require('pdfkit');
const router = express.Router();

var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
mongoose.set("strictQuery", true);
var cors = require("cors");
var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/customers");
var homeRouter = require("./routes/home");
var reviewsRouter = require("./routes/reviews");
var categoriesRouter = require("./routes/categories");
var attributesRouter = require("./routes/attributes");
var webBannerRouter = require("./routes/web-banner");
var appBannerRouter = require("./routes/app-banner");
var productsRouter = require("./routes/products");
var productsCreateRouter = require("./routes/products-create");
var productsUpdateRouter = require("./routes/products-update");
var productsDetailRouter = require("./routes/product-details")
var orderRouter = require("./routes/order");
var orderDetailsRouter = require("./routes/order-details");
var couponRouter = require("./routes/coupon");
var apiSingup = require("./api/singup");
var apiLogin = require("./api/login");
var apiCategory = require("./api/category");
var apiProduct = require("./api/products");
var apiBanners = require("./api/banners");
var apiAttributes = require("./api/attributes");
var apiWishlist = require("./api/wishlist");
var apiCart = require("./api/cart");
var apiCheckout = require("./api/checkout");
var apiCoupon = require("./api/coupon");
var productDetailsRouter = require("./routes/product-details");

var customerReportRouter = require("./routes/customer-report");

var orderReportRouter = require("./routes/order-report")
const editProfileRoutes = require("./routes/edit-profile");

var shippingCharge = require("./routes/shipping-charge");


const productAdd = require('./routes/product-add');

var app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use("/assets", express.static(path.join(__dirname, "public/assets")));
mongoose.set('debug', function (collectionName, method, query, doc) {
  console.log(`${collectionName}.${method}`, query, doc);
});

mongoose.connect(
  process.env.DATABASE_CONNECTION_STRING + '/' + process.env.DATABASE_NAME,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

console.log(
  "runn",
  process.env.DATABASE_CONNECTION_STRING + process.env.DATABASE_NAME
);
mongoose.connection
  .once("open", () => {
    console.log(
      "Well done! , connected with mongoDB database",
      process.env.DATABASE_CONNECTION_STRING + process.env.DATABASE_NAME
    );
  })
  .on("error", (error) => {
    console.log("Oops! database connection error:" + error.message);
  });


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "public/images")));


const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    cookie: { sameSite: true, maxAge: oneDay },
    resave: true,
    secret: process.env.AUTH_KEY,
    activeDuration: oneDay,
    saveUninitialized: true,
  })
);
// console.log("process.env.SEND_DATA_URL",process.env.SEND_DATA_URL);
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use(
  cors({
    // origin: process.env.SEND_DATA_URL
  })
);



app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
  

app.get("/test", (req, res) => {
  res.send("hello");
});
app.use("/", indexRouter);
app.use("/reviews", reviewsRouter);
app.use("/categories", categoriesRouter);
app.use("/customers", usersRouter);
app.use("/home", homeRouter);
app.use("/attributes", attributesRouter);
app.use("/web-banner", webBannerRouter);
app.use("/app-banner", appBannerRouter);
app.use("/products", productsRouter);
app.use("/products-details", productsDetailRouter);
app.use("/products-update", productsUpdateRouter);
app.use("/products-create", productsCreateRouter);
app.use("/order", orderRouter);
app.use("/order-details", orderDetailsRouter);
app.use("/coupon", couponRouter);
app.use("/api-singup", apiSingup);
app.use("/api-login", apiLogin);
app.use("/api-category", apiCategory);
app.use("/api-products", apiProduct); // localhost://api-products/all
app.use("/api-banners", apiBanners);
app.use("/api-attributes", apiAttributes);
app.use("/api-wishlist", apiWishlist);
app.use("/api-cart", apiCart);
app.use("/api-checkout", apiCheckout);
app.use("/api-coupon", apiCoupon);

app.use("/profile", editProfileRoutes);
app.use("/customer-report", customerReportRouter);
app.use("/order-report", orderReportRouter);
app.use("/shipping-charge", shippingCharge);

app.use('/product-add', productAdd); // this matches the form's action

// router.get('/customer-report/download-pdf', async (req, res) => {
//   try {
//       // Dummy customer data (Replace with actual customer data from DB)
//       const customers = [
//           { username: "john_doe", full_name: "John Doe", email: "john@example.com", phone: "1234567890", createdAt: "2024-03-01" },
//           { username: "jane_doe", full_name: "Jane Doe", email: "jane@example.com", phone: "9876543210", createdAt: "2024-03-05" },
//           // Add more customer data here
//       ];

//       // Create a PDF document
//       const doc = new PDFDocument();
//       const filePath = path.join(__dirname, 'customer-report.pdf');
//       const stream = fs.createWriteStream(filePath);
//       doc.pipe(stream);

//       // Title
//       doc.fontSize(20).text('Customer Report Analysis', { align: 'center' });
//       doc.moveDown(2);

//       // Table Headers
//       doc.fontSize(12).text('No.', 50, doc.y, { width: 50, align: 'left' });
//       doc.text('Username', 100, doc.y, { width: 150, align: 'left' });
//       doc.text('Full Name', 250, doc.y, { width: 150, align: 'left' });
//       doc.text('Email', 400, doc.y, { width: 200, align: 'left' });
//       doc.text('Phone', 600, doc.y, { width: 100, align: 'left' });
//       doc.text('Created At', 700, doc.y, { width: 100, align: 'left' });

//       doc.moveDown();

//       // Add customer data to PDF
//       customers.forEach((customer, index) => {
//           doc.text(index + 1, 50, doc.y, { width: 50, align: 'left' });
//           doc.text(customer.username, 100, doc.y, { width: 150, align: 'left' });
//           doc.text(customer.full_name, 250, doc.y, { width: 150, align: 'left' });
//           doc.text(customer.email, 400, doc.y, { width: 200, align: 'left' });
//           doc.text(customer.phone, 600, doc.y, { width: 100, align: 'left' });
//           doc.text(new Date(customer.createdAt).toLocaleDateString(), 700, doc.y, { width: 100, align: 'left' });
//           doc.moveDown();
//       });

//       // Finalize the document
//       doc.end();

//       stream.on('finish', function () {
//           res.download(filePath, 'customer-report.pdf', (err) => {
//               if (err) console.error(err);
//               fs.unlinkSync(filePath); // Delete file after sending
//           });
//       });

//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Error generating PDF');
//   }
// });

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
  res.render("error");
});
function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect('/admin/home'); // Redirect logged-in users to home
  }
  next();
}
app.get('/admin/login', redirectIfLoggedIn, (req, res) => {
  res.render('login');
});

app.get('/admin/forget-password', redirectIfLoggedIn, (req, res) => {
  res.render('forget-password');
});
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});



module.exports = app;
