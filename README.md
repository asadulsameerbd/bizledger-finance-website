# BizLedger — Multi-user business finance & operations suite

A full-stack business management app for independent online businesses. Each registered account has isolated products, sales, expenses, investments, customers and orders.

## Stack

- React + Vite
- Tailwind CSS + DaisyUI
- React Router + TanStack Query
- Express + MongoDB/Mongoose
- JWT authentication + bcrypt
- Lucide icons + Motion animations
- PDFKit for PDF invoices
- ExcelJS for XLSX exports

## Run locally

1. Install Node.js 20+ and MongoDB (local or Atlas).
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a long unique `JWT_SECRET`.
3. From project root:
   ```bash
   npm install
   npm run dev
   ```
4. Open https://bizledger-finance-website.vercel.app/. API runs on https://bizledger-finance-website.onrender.com/.

## Features

- User registration/login; records are scoped by authenticated user.
- Dashboard: revenue, COGS, operating expenses, net profit/loss, investment, units sold and recent sales.
- Products: catalogue, SKU, selling price, cost, stock tracking.
- Sales: manual sales entry; stock is reduced for linked products.
- Expenses and owner investment ledger.
- Customers: contact book, order count and customer lifetime order value.
- Orders: create orders with customer, line item, discount, delivery fee, order/payment status.
- PDF invoice download for each order.
- Monthly reports by year.
- Excel export with Summary, Sales, Expenses, Investments and Orders worksheets.
- Advanced analytics: six-month revenue/profit trend, average order value, profit margin, top products and customer/product metrics.
- Responsive navigation, mobile layout and animated transitions.

## Accounting notes

- Sales records power revenue, COGS, profit and monthly reports. Orders create corresponding sale records for their item lines.
- Order-level discount and delivery fee are shown in order totals/invoices but are not currently allocated into sales revenue or profit. For strict accounting, record delivery income/discount allocation separately.
- Changing an order status to Cancelled does not automatically reverse the sale or restock inventory. Handle returns/refunds with a dedicated reversal workflow before production use.
- Investment is tracked as owner funding and is not counted as sales revenue or profit.

## Before public production

This is a runnable application source project, not a hosted deployment. Configure MongoDB and environment variables. Deploy over HTTPS, use secure HttpOnly cookie sessions with CSRF protection, add rate limits to all sensitive endpoints, validation, audit logs, backups, monitoring and a proper refund/return workflow. Review local privacy, tax and accounting requirements. Test on a staging database before real business use.
