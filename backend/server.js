const express = require("express");
const cors = require("cors");
require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");
const stockAdjustmentRoutes = require("./routes/stockAdjustmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const db = require("./config/db");
const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) =>{
    res.json({
        message : "CC TV Point API is running"
    });
}
);

app.get("/api/test-db", async (req, res) =>{
    try{
        const[rows] = await db.query("SELECT 1 AS test");

        res.json({
            success : true,
            message : "MySQL connection successful",
            result : rows
        });
    }
    catch(error){
        console.error(error);

        res.status(500).json({
            success : false,
            message : "MySQL connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`server running on http://localhost:${PORT}`);
});