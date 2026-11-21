import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import {
  User,
  Product,
  Sale,
  Expense,
  Investment,
  Customer,
  Order,
} from "./models.js";

const app = express();
app.use(
  cors({
    origin:
      process.env.CLIENT_ORIGIN ||
      "https://bizledger-finance-website.vercel.app/",
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is required");

const auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Please log in." });
    const payload = jwt.verify(token, secret);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const own = (Model, userId, id) => Model.findOne({ _id: id, user: userId });

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8)
      return res
        .status(400)
        .json({
          message:
            "Name, email and a password of at least 8 characters are required.",
        });
    if (await User.findOne({ email: email.toLowerCase().trim() }))
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: "7d" });
    res
      .status(201)
      .json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
  }),
);
app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const user = await User.findOne({
      email: String(req.body.email || "")
        .toLowerCase()
        .trim(),
    });
    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.password))
    )
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  }),
);
app.get(
  "/api/auth/me",
  auth,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.userId).select("name email");
    if (!user) return res.status(401).json({ message: "Account not found." });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  }),
);

app.use("/api", auth);
app.get(
  "/api/dashboard",
  asyncRoute(async (req, res) => {
    const filter = { user: req.userId };
    const [sales, expenses, investments, products] = await Promise.all([
      Sale.find(filter).sort({ soldAt: -1 }).limit(8),
      Expense.find(filter),
      Investment.find(filter),
      Product.find(filter).sort({ createdAt: -1 }),
    ]);
    const allSales = await Sale.find(filter);
    const revenue = allSales.reduce((s, x) => s + x.total, 0);
    const cogs = allSales.reduce((s, x) => s + x.costTotal, 0);
    const expenseTotal = expenses.reduce((s, x) => s + x.amount, 0);
    const investmentTotal = investments.reduce((s, x) => s + x.amount, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todays = allSales.filter((x) => new Date(x.soldAt) >= today);
    res.json({
      stats: {
        revenue,
        cogs,
        expenses: expenseTotal,
        profit: revenue - cogs - expenseTotal,
        investment: investmentTotal,
        unitsSold: allSales.reduce((s, x) => s + x.quantity, 0),
        orders: allSales.length,
        todayRevenue: todays.reduce((s, x) => s + x.total, 0),
        todayOrders: todays.length,
        todayUnits: todays.reduce((s, x) => s + x.quantity, 0),
      },
      recentSales: sales,
      products,
      lowStock: products.filter((p) => p.stock <= 5),
    });
  }),
);

app.get(
  "/api/products",
  asyncRoute(async (req, res) =>
    res.json(await Product.find({ user: req.userId }).sort({ createdAt: -1 })),
  ),
);
app.post(
  "/api/products",
  asyncRoute(async (req, res) => {
    const { name, sku = "", price, cost, stock = 0 } = req.body;
    if (
      !name?.trim() ||
      ![price, cost, stock].every(
        (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
      )
    )
      return res
        .status(400)
        .json({
          message: "Enter a product name and valid non-negative amounts.",
        });
    res
      .status(201)
      .json(
        await Product.create({
          user: req.userId,
          name,
          sku,
          price: Number(price),
          cost: Number(cost),
          stock: Number(stock),
        }),
      );
  }),
);
app.put(
  "/api/products/:id",
  asyncRoute(async (req, res) => {
    const p = await own(Product, req.userId, req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found." });
    const fields = ["name", "sku", "price", "cost", "stock"];
    fields.forEach((k) => {
      if (req.body[k] !== undefined) p[k] = req.body[k];
    });
    await p.save();
    res.json(p);
  }),
);
app.delete(
  "/api/products/:id",
  asyncRoute(async (req, res) => {
    const p = await own(Product, req.userId, req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found." });
    await p.deleteOne();
    res.json({ message: "Product deleted." });
  }),
);

app.get(
  "/api/sales",
  asyncRoute(async (req, res) =>
    res.json(
      await Sale.find({ user: req.userId }).sort({ soldAt: -1 }).limit(200),
    ),
  ),
);
app.post(
  "/api/sales",
  asyncRoute(async (req, res) => {
    const {
      productId,
      productName,
      quantity,
      unitPrice,
      unitCost,
      note = "",
      soldAt,
    } = req.body;
    const qty = Number(quantity),
      price = Number(unitPrice),
      cost = Number(unitCost);
    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      ![price, cost].every((v) => Number.isFinite(v) && v >= 0)
    )
      return res
        .status(400)
        .json({
          message: "Enter a valid quantity, selling price and product cost.",
        });
    let product = null,
      name = productName?.trim();
    if (productId) {
      product = await own(Product, req.userId, productId);
      if (!product)
        return res.status(404).json({ message: "Product not found." });
      if (product.stock < qty)
        return res
          .status(400)
          .json({ message: "Not enough stock for this sale." });
      name = product.name;
      product.stock -= qty;
      await product.save();
    }
    if (!name)
      return res.status(400).json({ message: "Product name is required." });
    const sale = await Sale.create({
      user: req.userId,
      product: product?._id || null,
      productName: name,
      quantity: qty,
      unitPrice: price,
      unitCost: cost,
      total: qty * price,
      costTotal: qty * cost,
      note,
      soldAt: soldAt || new Date(),
    });
    res.status(201).json(sale);
  }),
);
app.delete(
  "/api/sales/:id",
  asyncRoute(async (req, res) => {
    const sale = await own(Sale, req.userId, req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found." });
    if (sale.product) {
      const p = await own(Product, req.userId, sale.product);
      if (p) {
        p.stock += sale.quantity;
        await p.save();
      }
    }
    await sale.deleteOne();
    res.json({ message: "Sale deleted and stock restored." });
  }),
);

app.get(
  "/api/expenses",
  asyncRoute(async (req, res) =>
    res.json(
      await Expense.find({ user: req.userId }).sort({ spentAt: -1 }).limit(300),
    ),
  ),
);
app.post(
  "/api/expenses",
  asyncRoute(async (req, res) => {
    const { title, category = "Other", amount, spentAt, note = "" } = req.body;
    if (
      !title?.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    )
      return res
        .status(400)
        .json({ message: "Enter a title and valid amount." });
    res
      .status(201)
      .json(
        await Expense.create({
          user: req.userId,
          title,
          category,
          amount: Number(amount),
          spentAt: spentAt || new Date(),
          note,
        }),
      );
  }),
);
app.delete(
  "/api/expenses/:id",
  asyncRoute(async (req, res) => {
    const x = await own(Expense, req.userId, req.params.id);
    if (!x) return res.status(404).json({ message: "Expense not found." });
    await x.deleteOne();
    res.json({ message: "Expense deleted." });
  }),
);
app.get(
  "/api/investments",
  asyncRoute(async (req, res) =>
    res.json(
      await Investment.find({ user: req.userId })
        .sort({ investedAt: -1 })
        .limit(300),
    ),
  ),
);
app.post(
  "/api/investments",
  asyncRoute(async (req, res) => {
    const { title, amount, investedAt, note = "" } = req.body;
    if (
      !title?.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    )
      return res
        .status(400)
        .json({ message: "Enter a title and valid amount." });
    res
      .status(201)
      .json(
        await Investment.create({
          user: req.userId,
          title,
          amount: Number(amount),
          investedAt: investedAt || new Date(),
          note,
        }),
      );
  }),
);
app.delete(
  "/api/investments/:id",
  asyncRoute(async (req, res) => {
    const x = await own(Investment, req.userId, req.params.id);
    if (!x) return res.status(404).json({ message: "Investment not found." });
    await x.deleteOne();
    res.json({ message: "Investment deleted." });
  }),
);

// Customer CRM — every query is scoped to the authenticated account.
app.get(
  "/api/customers",
  asyncRoute(async (req, res) => {
    const customers = await Customer.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    const ids = customers.map((c) => c._id);
    const counts = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          customer: { $in: ids },
        },
      },
      {
        $group: {
          _id: "$customer",
          orders: { $sum: 1 },
          spent: { $sum: "$total" },
        },
      },
    ]);
    const map = new Map(counts.map((x) => [String(x._id), x]));
    res.json(
      customers.map((c) => ({
        ...c.toObject(),
        orderCount: map.get(String(c._id))?.orders || 0,
        totalSpent: map.get(String(c._id))?.spent || 0,
      })),
    );
  }),
);
app.post(
  "/api/customers",
  asyncRoute(async (req, res) => {
    const { name, phone = "", email = "", address = "", note = "" } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Customer name is required." });
    res
      .status(201)
      .json(
        await Customer.create({
          user: req.userId,
          name,
          phone,
          email,
          address,
          note,
        }),
      );
  }),
);
app.put(
  "/api/customers/:id",
  asyncRoute(async (req, res) => {
    const c = await own(Customer, req.userId, req.params.id);
    if (!c) return res.status(404).json({ message: "Customer not found." });
    ["name", "phone", "email", "address", "note"].forEach((k) => {
      if (req.body[k] !== undefined) c[k] = req.body[k];
    });
    await c.save();
    res.json(c);
  }),
);
app.delete(
  "/api/customers/:id",
  asyncRoute(async (req, res) => {
    const c = await own(Customer, req.userId, req.params.id);
    if (!c) return res.status(404).json({ message: "Customer not found." });
    await Order.updateMany(
      { user: req.userId, customer: c._id },
      { $set: { customer: null } },
    );
    await c.deleteOne();
    res.json({ message: "Customer deleted. Existing orders were kept." });
  }),
);

// Order management. Orders create corresponding sales entries for consistent revenue/profit reports.
app.get(
  "/api/orders",
  asyncRoute(async (req, res) =>
    res.json(
      await Order.find({ user: req.userId })
        .populate("customer", "name phone")
        .sort({ orderDate: -1 })
        .limit(500),
    ),
  ),
);
app.post(
  "/api/orders",
  asyncRoute(async (req, res) => {
    const {
      customerId,
      customerName,
      customerPhone = "",
      items = [],
      discount = 0,
      deliveryFee = 0,
      status = "Pending",
      paymentStatus = "Unpaid",
      orderDate,
      note = "",
    } = req.body;
    if (!customerName?.trim() || !Array.isArray(items) || !items.length)
      return res
        .status(400)
        .json({
          message: "Customer name and at least one order item are required.",
        });
    const disc = Number(discount),
      delivery = Number(deliveryFee);
    if (![disc, delivery].every((v) => Number.isFinite(v) && v >= 0))
      return res
        .status(400)
        .json({ message: "Discount and delivery fee must be valid amounts." });
    let customer = null;
    if (customerId) {
      customer = await own(Customer, req.userId, customerId);
      if (!customer)
        return res.status(404).json({ message: "Customer not found." });
    }
    const normalized = [];
    for (const item of items) {
      const qty = Number(item.quantity),
        price = Number(item.unitPrice),
        cost = Number(item.unitCost);
      if (
        !Number.isInteger(qty) ||
        qty < 1 ||
        ![price, cost].every((v) => Number.isFinite(v) && v >= 0)
      )
        return res
          .status(400)
          .json({ message: "Invalid item quantity or price." });
      let product = null,
        name = String(item.productName || "").trim();
      if (item.productId) {
        product = await own(Product, req.userId, item.productId);
        if (!product)
          return res
            .status(404)
            .json({ message: "An order product was not found." });
        if (product.stock < qty)
          return res
            .status(400)
            .json({ message: `Not enough stock for ${product.name}.` });
        name = product.name;
        product.stock -= qty;
        await product.save();
      }
      if (!name)
        return res
          .status(400)
          .json({ message: "Every order item needs a product name." });
      normalized.push({
        product: product?._id || null,
        productName: name,
        quantity: qty,
        unitPrice: price,
        unitCost: cost,
        total: qty * price,
      });
    }
    const subtotal = normalized.reduce((sum, x) => sum + x.total, 0);
    if (disc > subtotal)
      return res
        .status(400)
        .json({ message: "Discount cannot exceed the subtotal." });
    const orderNumber = `BL-${Date.now().toString().slice(-9)}`;
    const order = await Order.create({
      user: req.userId,
      orderNumber,
      customer: customer?._id || null,
      customerName: customer?.name || customerName,
      customerPhone: customer?.phone || customerPhone,
      items: normalized,
      subtotal,
      discount: disc,
      deliveryFee: delivery,
      total: subtotal - disc + delivery,
      status,
      paymentStatus,
      orderDate: orderDate || new Date(),
      note,
    });
    for (const item of normalized) {
      await Sale.create({
        user: req.userId,
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        total: item.total,
        costTotal: item.quantity * item.unitCost,
        note: `Order ${orderNumber}`,
        soldAt: order.orderDate,
      });
    }
    res.status(201).json(order);
  }),
);
app.patch(
  "/api/orders/:id",
  asyncRoute(async (req, res) => {
    const order = await own(Order, req.userId, req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (
      req.body.status &&
      ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(
        req.body.status,
      )
    )
      order.status = req.body.status;
    if (
      req.body.paymentStatus &&
      ["Unpaid", "Partial", "Paid"].includes(req.body.paymentStatus)
    )
      order.paymentStatus = req.body.paymentStatus;
    await order.save();
    res.json(order);
  }),
);

// Monthly reports and trend metrics.
app.get(
  "/api/reports/monthly",
  asyncRoute(async (req, res) => {
    const year = Math.max(
      2000,
      Math.min(2100, Number(req.query.year) || new Date().getFullYear()),
    );
    const start = new Date(year, 0, 1),
      end = new Date(year + 1, 0, 1),
      user = new mongoose.Types.ObjectId(req.userId);
    const [sales, expenses, investments] = await Promise.all([
      Sale.find({ user, soldAt: { $gte: start, $lt: end } }),
      Expense.find({ user, spentAt: { $gte: start, $lt: end } }),
      Investment.find({ user, investedAt: { $gte: start, $lt: end } }),
    ]);
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString("en", { month: "short" }),
      revenue: 0,
      cogs: 0,
      expenses: 0,
      investment: 0,
      orders: 0,
      units: 0,
    }));
    sales.forEach((x) => {
      const m = months[new Date(x.soldAt).getMonth()];
      m.revenue += x.total;
      m.cogs += x.costTotal;
      m.orders++;
      m.units += x.quantity;
    });
    expenses.forEach(
      (x) => (months[new Date(x.spentAt).getMonth()].expenses += x.amount),
    );
    investments.forEach(
      (x) => (months[new Date(x.investedAt).getMonth()].investment += x.amount),
    );
    months.forEach((m) => (m.profit = m.revenue - m.cogs - m.expenses));
    res.json({
      year,
      months,
      totals: months.reduce(
        (a, m) => {
          [
            "revenue",
            "cogs",
            "expenses",
            "investment",
            "orders",
            "units",
            "profit",
          ].forEach((k) => (a[k] += m[k] || 0));
          return a;
        },
        {
          revenue: 0,
          cogs: 0,
          expenses: 0,
          investment: 0,
          orders: 0,
          units: 0,
          profit: 0,
        },
      ),
    });
  }),
);
app.get(
  "/api/analytics",
  asyncRoute(async (req, res) => {
    const user = new mongoose.Types.ObjectId(req.userId),
      now = new Date(),
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [sales, expenses, products, orders] = await Promise.all([
      Sale.find({ user, soldAt: { $gte: start } }),
      Expense.find({ user, spentAt: { $gte: start } }),
      Product.find({ user }),
      Order.find({ user }),
    ]);
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        month: d.toLocaleString("en", { month: "short" }),
        revenue: 0,
        profit: 0,
        orders: 0,
      };
    });
    sales.forEach((x) => {
      const idx =
        (new Date(x.soldAt).getFullYear() - start.getFullYear()) * 12 +
        new Date(x.soldAt).getMonth() -
        start.getMonth();
      if (monthly[idx]) {
        monthly[idx].revenue += x.total;
        monthly[idx].profit += x.total - x.costTotal;
        monthly[idx].orders++;
      }
    });
    expenses.forEach((x) => {
      const idx =
        (new Date(x.spentAt).getFullYear() - start.getFullYear()) * 12 +
        new Date(x.spentAt).getMonth() -
        start.getMonth();
      if (monthly[idx]) monthly[idx].profit -= x.amount;
    });
    const byProduct = {};
    sales.forEach((x) => {
      const p =
        byProduct[x.productName] ||
        (byProduct[x.productName] = {
          name: x.productName,
          revenue: 0,
          units: 0,
          profit: 0,
        });
      p.revenue += x.total;
      p.units += x.quantity;
      p.profit += x.total - x.costTotal;
    });
    const allRevenue = sales.reduce((a, x) => a + x.total, 0),
      allProfit = monthly.reduce((a, x) => a + x.profit, 0);
    res.json({
      monthly,
      topProducts: Object.values(byProduct)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      metrics: {
        averageOrderValue: orders.length
          ? orders.reduce((a, x) => a + x.total, 0) / orders.length
          : 0,
        profitMargin: allRevenue ? (allProfit / allRevenue) * 100 : 0,
        activeProducts: products.length,
        lowStock: products.filter((x) => x.stock <= 5).length,
        orders: orders.length,
        customers: await Customer.countDocuments({ user }),
      },
    });
  }),
);

// Downloadable customer-facing invoice PDF, generated from an owned order.
app.get(
  "/api/orders/:id/invoice.pdf",
  asyncRoute(async (req, res) => {
    const order = await own(Order, req.userId, req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${order.orderNumber}-invoice.pdf"`,
    );
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    doc.pipe(res);
    doc.fillColor("#6258e8").fontSize(25).text("BIZLEDGER", 48, 48);
    doc.fillColor("#22283b").fontSize(20).text("INVOICE", { align: "right" });
    doc
      .moveDown(1.5)
      .fontSize(10)
      .fillColor("#747b8e")
      .text(`Invoice: ${order.orderNumber}`)
      .text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`)
      .text(`Status: ${order.status} · ${order.paymentStatus}`);
    doc.moveDown().fillColor("#22283b").fontSize(12).text("BILL TO");
    doc
      .fontSize(10)
      .fillColor("#747b8e")
      .text(order.customerName)
      .text(order.customerPhone || "");
    let y = 250;
    doc
      .fillColor("#6258e8")
      .fontSize(9)
      .text("ITEM", 48, y)
      .text("QTY", 330, y)
      .text("UNIT PRICE", 380, y)
      .text("TOTAL", 480, y, { width: 65, align: "right" });
    y += 22;
    doc.moveTo(48, y).lineTo(545, y).strokeColor("#e6e8ef").stroke();
    order.items.forEach((item) => {
      y += 13;
      doc
        .fillColor("#30364a")
        .fontSize(10)
        .text(item.productName, 48, y, { width: 255 })
        .text(String(item.quantity), 330, y)
        .text(`৳ ${item.unitPrice.toFixed(2)}`, 380, y)
        .text(`৳ ${item.total.toFixed(2)}`, 470, y, {
          width: 75,
          align: "right",
        });
      y += 12;
    });
    y += 20;
    doc.moveTo(340, y).lineTo(545, y).strokeColor("#e6e8ef").stroke();
    y += 14;
    [
      ["Subtotal", order.subtotal],
      ["Discount", -order.discount],
      ["Delivery fee", order.deliveryFee],
      ["Grand total", order.total],
    ].forEach(([label, value], i) => {
      doc
        .fillColor(i === 3 ? "#6258e8" : "#747b8e")
        .fontSize(i === 3 ? 13 : 10)
        .text(label, 350, y, { width: 100 })
        .text(`৳ ${Number(value).toFixed(2)}`, 450, y, {
          width: 95,
          align: "right",
        });
      y += 20;
    });
    doc
      .moveDown(3)
      .fontSize(9)
      .fillColor("#9ba1b1")
      .text("Thank you for your business.", { align: "center" });
    doc.end();
  }),
);

// Excel export contains separate sheets for monthly summary, sales, expenses and investments.
app.get(
  "/api/export.xlsx",
  asyncRoute(async (req, res) => {
    const [sales, expenses, investments, orders] = await Promise.all([
      Sale.find({ user: req.userId }).sort({ soldAt: -1 }),
      Expense.find({ user: req.userId }).sort({ spentAt: -1 }),
      Investment.find({ user: req.userId }).sort({ investedAt: -1 }),
      Order.find({ user: req.userId }).sort({ orderDate: -1 }),
    ]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BizLedger";
    workbook.created = new Date();
    const addSheet = (name, headers, rows) => {
      const ws = workbook.addWorksheet(name);
      ws.addRow(headers);
      rows.forEach((r) => ws.addRow(r));
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6258E8" },
      };
      ws.columns.forEach(
        (c) =>
          (c.width = Math.max(14, Math.min(30, (c.header || "").length + 12))),
      );
      ws.views = [{ state: "frozen", ySplit: 1 }];
    };
    addSheet(
      "Sales",
      ["Product", "Quantity", "Unit price", "Revenue", "Product cost", "Date"],
      sales.map((x) => [
        x.productName,
        x.quantity,
        x.unitPrice,
        x.total,
        x.costTotal,
        x.soldAt,
      ]),
    );
    addSheet(
      "Expenses",
      ["Title", "Category", "Amount", "Date", "Note"],
      expenses.map((x) => [x.title, x.category, x.amount, x.spentAt, x.note]),
    );
    addSheet(
      "Investments",
      ["Title", "Amount", "Date", "Note"],
      investments.map((x) => [x.title, x.amount, x.investedAt, x.note]),
    );
    addSheet(
      "Orders",
      ["Order number", "Customer", "Status", "Payment", "Total", "Date"],
      orders.map((x) => [
        x.orderNumber,
        x.customerName,
        x.status,
        x.paymentStatus,
        x.total,
        x.orderDate,
      ]),
    );
    const revenue = sales.reduce((a, x) => a + x.total, 0),
      cogs = sales.reduce((a, x) => a + x.costTotal, 0),
      expenseTotal = expenses.reduce((a, x) => a + x.amount, 0);
    addSheet(
      "Summary",
      ["Metric", "Amount"],
      [
        ["Revenue", revenue],
        ["Cost of goods", cogs],
        ["Expenses", expenseTotal],
        ["Net profit / loss", revenue - cogs - expenseTotal],
        ["Investment", investments.reduce((a, x) => a + x.amount, 0)],
      ],
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bizledger-business-report.xlsx"',
    );
    await workbook.xlsx.write(res);
    res.end();
  }),
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bizledger")
  .then(() =>
    app.listen(port, () => console.log(`BizLedger API running on ${port}`)),
  )
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
