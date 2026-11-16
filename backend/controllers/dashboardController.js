
const db = require("../config/db");

// GET /api/dashboard
exports.getDashboardSummary = async (req, res) => {
    try {
        const [
            [productStats],
            [customerStats],
            [supplierStats],
            [salesStats],
            [todayStats],
            [purchaseStats],
            [lowStockProducts],
            [recentSales]
        ] = await Promise.all([
            // Total products and total units in stock.
            db.query(`
                SELECT
                    COUNT(*) AS total_products,
                    COALESCE(SUM(stock), 0) AS total_stock_units
                FROM products
            `),

            // Total customers.
            db.query(`
                SELECT COUNT(*) AS total_customers
                FROM customers
            `),

            // Total suppliers.
            db.query(`
                SELECT COUNT(*) AS total_suppliers
                FROM suppliers
            `),

            // Overall sales summary.
            db.query(`
                SELECT
                    COUNT(*) AS total_sales,
                    COALESCE(SUM(total), 0) AS total_sales_value,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN payment_status = 'paid'
                                THEN total
                                ELSE 0
                            END
                        ), 0
                    ) AS paid_revenue
                FROM sales
            `),

            // Sales recorded today according to MySQL's date.
            db.query(`
                SELECT
                    COUNT(*) AS today_sales_count,
                    COALESCE(SUM(total), 0) AS today_sales_value,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN payment_status = 'paid'
                                THEN total
                                ELSE 0
                            END
                        ), 0
                    ) AS today_paid_revenue
                FROM sales
                WHERE created_at >= CURDATE()
                  AND created_at < CURDATE() + INTERVAL 1 DAY
            `),

            // Overall purchase summary.
            db.query(`
                SELECT
                    COUNT(*) AS total_purchases,
                    COALESCE(SUM(total), 0) AS total_purchases_value
                FROM purchases
            `),

            // Products at or below their minimum stock level.
            db.query(`
                SELECT
                    id,
                    name,
                    sku,
                    stock,
                    minimum_stock
                FROM products
                WHERE stock <= minimum_stock
                ORDER BY stock ASC, name ASC
                LIMIT 10
            `),

            // Five most recent invoices.
            db.query(`
                SELECT
                    s.id,
                    s.invoice_no,
                    s.total,
                    s.payment_status,
                    s.payment_method,
                    s.created_at,
                    c.name AS customer_name
                FROM sales s
                LEFT JOIN customers c
                    ON s.customer_id = c.id
                ORDER BY s.id DESC
                LIMIT 5
            `)
        ]);

        res.json({
            success: true,
            data: {
                products: productStats[0],
                customers: customerStats[0],
                suppliers: supplierStats[0],
                sales: salesStats[0],
                today: todayStats[0],
                purchases: purchaseStats[0],
                low_stock_products: lowStockProducts,
                recent_sales: recentSales
            }
        });
    } catch (error) {
        console.error(
            "Dashboard summary error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary"
        });
    }
};
