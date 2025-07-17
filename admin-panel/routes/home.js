var express = require("express");
var router = express.Router();
var productsModel = require("../models/products.model");
var orderModel = require("../models/order.model");
var customerModel = require("../models/customer");
var reviewsModel = require("../models/reviews.model");
const moment = require('moment');
var categoryModel = require("../models/categories.model");
const OrderItem = require("../models/order-items"); // or plural if named that way

var app = express();

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

function getMonthYear(date) {
  return moment(date).format("MMM YYYY");
}

router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/admin");
  }
  next();
});

function isIn2025(date) {
  return moment(date).year() === 2025;
}



router.get("/", async function (req, res, next) {
  if (isNaN(req.session.count) || req.session.count >= 0) {
    try {
      let categories = await categoryModel.find({ is_delete: false }).lean();
      let orders = await orderModel.find({ is_delete: false }).lean();
      let customers = await customerModel.find({ is_delete: false }).lean();
      let products = await productsModel.find({ is_delete: false }).lean();
      let reviews = await reviewsModel.find({ is_delete: false }).lean();

      orders = orders.filter(order => isIn2025(order.createdAt));
      categories = categories.filter(category => isIn2025(category.createdAt));
      customers = customers.filter(customer => isIn2025(customer.createdAt));
      products = products.filter(product => isIn2025(product.createdAt));
      reviews = reviews.filter(review => isIn2025(review.createdAt));

      let categoryCountByMonth = {};
      categories.forEach(category => {
        let monthYear = getMonthYear(new Date(category.createdAt));
        categoryCountByMonth[monthYear] = (categoryCountByMonth[monthYear] || 0) + 1;
      });

      let customerCountByMonth = {};
      customers.forEach(customer => {
        let monthYear = getMonthYear(new Date(customer.createdAt));
        customerCountByMonth[monthYear] = (customerCountByMonth[monthYear] || 0) + 1;
      });

      let reviewCountByMonth = {};
      reviews.forEach(review => {
        let monthYear = getMonthYear(new Date(review.createdAt));
        reviewCountByMonth[monthYear] = (reviewCountByMonth[monthYear] || 0) + 1;
      });

      let productCountByMonth = {};
      products.forEach(product => {
        let monthYear = getMonthYear(new Date(product.createdAt));
        productCountByMonth[monthYear] = (productCountByMonth[monthYear] || 0) + 1;
      });

      let orderCountByMonth = {};
      orders.forEach(order => {
        let monthYear = getMonthYear(new Date(order.createdAt));
        orderCountByMonth[monthYear] = (orderCountByMonth[monthYear] || 0) + 1;
      });

      const months = [
        "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
        "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"
      ];

      let categoryData = months.map(month => categoryCountByMonth[month] || 0);
      let customerData = months.map(month => customerCountByMonth[month] || 0);
      let reviewData = months.map(month => reviewCountByMonth[month] || 0);
      let productData = months.map(month => productCountByMonth[month] || 0);
      let orderData = months.map(month => orderCountByMonth[month] || 0);

      const currentYear = new Date().getFullYear();



      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Total orders (today / month / all)
      const [totalOrders, totalTodayOrders, totalMonthOrders] = await Promise.all([
        orderModel.countDocuments({ is_delete: false }),
        orderModel.countDocuments({ createdAt: { $gte: today }, is_delete: false }),
        orderModel.countDocuments({ createdAt: { $gte: firstDayOfMonth }, is_delete: false })
      ]);

      // Total customers
      const totalCustomers = await customerModel.countDocuments({});

      // Pending & Cancelled Orders
      const [pendingOrdersCount, cancelledOrdersCount] = await Promise.all([
        orderModel.countDocuments({ status: "Pending", is_delete: false }),
        orderModel.countDocuments({ status: "Cancelled", is_delete: false })
      ]);

      // Low stock products
      const threshold = 10;
      const lowStockCount = await productsModel.countDocuments({ total_stock: { $lt: threshold }, is_delete: false });

      // Active products
      const activeProductsCount = await productsModel.countDocuments({ status: true, is_delete: false });

      const totalRevenue = await orderModel.aggregate([
        {
          $match: {
            payment: true,
            is_delete: false
          }
        },
        {
          $project: {
            totalCost: { $toDouble: "$totalCost" } // safely converts to number
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalCost" }
          }
        }
      ]);

      const revenue = totalRevenue[0]?.total || 0;
      console.log("Total Revenue ₹:", revenue);




      const pendingOrders = await orderModel.countDocuments({ status: "Pending" });
      const cancelledOrders = await orderModel.countDocuments({ status: "Cancelled" });
      
      const activeProducts = await productsModel.countDocuments({
        status: true, is_delete: false
      });



    
      // ORDER STATUS PIE CHART
      const orderStatusPie = await orderModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
  
      // REVENUE BY CATEGORY
      const revenueByCategory = await OrderItem.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productID",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
      
        // Use first parent category
        {
          $addFields: {
            primaryCategory: { $arrayElemAt: ["$product.sub_categories", 0] }
          }
          
        },
      
        // Lookup category name
        {
          $lookup: {
            from: "categories",
            localField: "primaryCategory",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind: { path: "$category", preserveNullAndEmptyArrays: true }
        },
      
        {
          $group: {
            _id: {
              $cond: [
                { $ifNull: ["$category.name", false] },
                "$category.name",
                "Uncategorized"
              ]
            },
            totalRevenue: { $sum: "$subtotal" }
          }
        },
        {
          $sort: { totalRevenue: -1 }},
        { $limit: 5 } 
      ]);
      
      
      // TOP SELLING PRODUCTS
      const topSellingProducts = await OrderItem.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productID", // ✅ match your field
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$product.title", "Unknown"] },
            totalSold: { $sum: "$quantity" }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]);
      console.log("Sample Order:", await orderModel.findOne().lean());
      console.log("Sample Product:", await productsModel.findOne().lean());
      console.log("Sample OrderItem:", await OrderItem.findOne().lean());
            
      const monthlyRevenueData = await orderModel.aggregate([
        {
          $match: {
            is_delete: false,
            payment: true,
            createdAt: {
              $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
              $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $project: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            totalCost: { $toDouble: "$totalCost" }
          }
        },
        {
          $group: {
            _id: { month: "$month", year: "$year" },
            revenue: { $sum: "$totalCost" }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
      ]);
      
      const formattedMonthlyRevenue = Array(12).fill(0);
      monthlyRevenueData.forEach(item => {
        const monthIndex = item._id.month - 1;
        formattedMonthlyRevenue[monthIndex] = item.revenue;
      });
      
      const categoryWiseProductCount = await productsModel.aggregate([
        {
          $match: { is_delete: false }
        },
        {
          $unwind: "$sub_categories"
        },
        {
          $lookup: {
            from: "categories",
            localField: "sub_categories",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      const mostReviewedProducts = await reviewsModel.aggregate([
        {
          $match: { is_delete: false }
        },
        {
          $group: {
            _id: "$product_id",
            reviewCount: { $sum: 1 }
          }
        },
        {
          $sort: { reviewCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 0,
            productTitle: "$product.title",
            reviewCount: 1
          }
        }
      ]);

      const topCustomers = await orderModel.aggregate([
        {
          $match: {
            payment: true,
            is_delete: false
          }
        },
        {
          $group: {
            _id: "$customer_id",
            totalAmount: { $sum: { $toDouble: "$totalCost" } }
          }
        },
        {
          $sort: { totalAmount: -1 }
        },
        { $limit: 5 },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $unwind: "$customer"
        }
      ]);
      
      const ordersData = await orderModel.find(); // or use your actual query
      let totalValue = 0;
      let orderCount = ordersData.length;
  
      ordersData.forEach(order => {
        totalValue += order.total_price || 0; // adjust the field name if different
      });
  
      const averageOrderValue = orderCount > 0 ? (totalValue / orderCount).toFixed(2) : 0;
  
      const lowStockProducts = await productsModel.find({ total_stock: { $lte: 10 } , is_delete:false}, { title: 1, total_stock: 1 });

      const recentProducts = await productsModel.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  
   
      res.render("home", {
        months: months,
        categoryData: categoryData,
        customerData: customerData,
        reviewData: reviewData,
        productData: productData,
        orderData: orderData,
        currentYear: currentYear,
        adminName: req.session.user.username,
        totalRevenue,
        pendingOrdersCount,
        cancelledOrdersCount,
        lowStockCount,
        activeProductsCount,
        totalOrders,
        totalTodayOrders,
        totalMonthOrders,
        totalCustomers,
        totalRevenue,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        cancelledOrders,
        lowStockProducts,
        activeProducts,

        orderStatusPie,
        revenueByCategory,
        topSellingProducts,

        monthlyRevenueData: formattedMonthlyRevenue,
        categoryWiseProductCount,
        mostReviewedProducts,

        topCustomers,
        averageOrderValue,
        recentProducts,
        lowStockProducts,
        averageOrderValue,

      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Internal Server Error");
      res.render("home", {
        totalRevenue: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        lowStockProducts: 0,
        activeProducts: 0,


        salesOverview: [],
        orderStatusPie: [],
        revenueByCategory: [],
        topSellingProducts: []
      });
    }
  } else {
    res.redirect("/admin");
  }
});

router.get("/refresh", (req, res) => {
  res.render("refresh");
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.status(500).send("Logout Failed");
    }

    res.setHeader("Cache-Control", "no-store");

    // Clear history and redirect to login
    res.send(`
      <script>
        history.pushState(null, null, "/admin");
        window.location.replace("/admin");
      </script>
    `);
  });
});


module.exports = router;
