# 🌾 Subbayya Gari Hotel — Full-Stack Ordering & Owner Admin Management System

> **Authentic Andhra Pure Vegetarian Butta Bhojanam Since 1950**  
> A production-ready Full-Stack Restaurant Ordering and Owner/Admin Operations Portal unified on a single **Node.js, Express, MongoDB, and Socket.IO** backend.

---

## 🏛️ System Architecture

```
CUSTOMER WEBSITE (http://localhost:5000/)
     │  - Live Menu from MongoDB
     │  - Cart & Checkout (Delivery / Takeaway / Dine-In)
     │  - Real-time Order Tracking Modal
     ▼
REST API & SOCKET.IO BROADCAST (Express.js)
     ▲
     │  - Real-time Order Notifications (Audio Chime + Live Banner)
     │  - Full Kitchen Order Pipeline & Status Workflow
     │  - Menu Management (Add, Edit, Price Change, In/Out of Stock)
     │  - Customer Directory & Lifetime Spend History
     │  - Real-time Financial Analytics & Chart.js Trends
     │  - Receipt Printing & CSV Export
     │
OWNER PORTAL (http://localhost:5000/owner/)
     │
     ▼
MONGODB SHARED DATABASE (mongodb://127.0.0.1:27017/subbayya_gari_hotel)
     • Users (Role-based: customer / owner)
     • MenuItems (with availability, pricing, categories)
     • Orders (with immutable historical item price snapshots)
     • Settings (Open/Closed status, Delivery/Packaging fees, UPI)
     • Counters (Sequential human-friendly IDs: SGH-10001, SGH-10002...)
```

---

## 🔑 Owner Credentials

- **Portal URL:** [http://localhost:5000/owner/](http://localhost:5000/owner/)
- **Owner Name:** `G. Subbayya`
- **Owner Email:** `myakalanagarjun09@gmail.com`
- **Owner Phone:** `9121792433`
- **Owner Password:** `123456`
- **Role:** `owner` (Protected with JWT authentication middleware)

---

## 🌟 Key Features

### 🍽️ Customer Website (`/`)
1. **Database-Driven Menu:** Dynamically queries `GET /api/menu` to render all 24+ authentic Godavari delicacies with live availability (Out-of-Stock items disable ordering).
2. **Order Placement with Price Verification:** Calculates pricing server-side from database records and creates immutable snapshots.
3. **Sequential Order Numbers:** Generates clean, human-friendly order IDs (e.g. `SGH-10001`).
4. **Real-time Live Order Tracking:** Interactive multi-stage tracking modal (`Pending` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Out for Delivery` ➔ `Completed`) synced via Socket.IO.
5. **Kitchen Open/Closed Banner:** Displays operational status controlled by the owner in real time.

### 👑 Owner / Admin Portal (`/owner/`)
1. **Modern Dashboard (`dashboard.html`):**
   - Real-time summary stat cards: Today's Orders, Today's Revenue, Pending, Preparing, Ready, Completed, Cancelled, and Total Customers.
   - Interactive Chart.js 7-day revenue trend chart.
   - Top-selling items list dynamically calculated from order records.
   - Recent orders quick-actions table.
2. **Order Management (`orders.html`):**
   - Multi-filter pipeline: Order Status, Order Type (Delivery, Takeaway, Dine-In), Payment Status, Date Range, and Search.
   - Quick Status transition buttons directly in table rows.
   - CSV Export with active filters.
3. **Order Details & Receipt Printing (`order-details.html`):**
   - Full customer information, delivery address with one-click **Google Maps Live GPS** pin navigation.
   - Item breakdown with price snapshots at time of purchase.
   - Status transition workflow controls with audit trail log.
   - Thermal/A4 print-ready receipt generator.
4. **Menu Management (`menu.html`):**
   - Add new items with full categorization, Telugu titles, prep time, and dietary tags.
   - Instant In-Stock / Out-of-Stock toggle switch (`isAvailable`).
   - Edit pricing and descriptions (changes reflect instantly on customer website).
   - Soft-delete to preserve previous order histories.
5. **Customer Directory (`customers.html`):**
   - Search by name, phone, email, or Customer ID.
   - Aggregated lifetime statistics: Total Orders, Total Spent, Registration Tier.
   - Complete previous order history modal for every customer.
6. **Sales Analytics & Reports (`reports.html`):**
   - Dual-axis Chart.js revenue & order volume graph.
   - Best-selling dishes rankings by portion volume and gross sales.
   - Channel breakdown by Order Type and Payment Method.
7. **Restaurant Settings (`settings.html`):**
   - Live Store Open/Closed switch.
   - Operating hours, Delivery fee configuration (base + per km), Packaging fee, Tax %.
   - UPI ID & QR payment information.

---

## 📁 Directory Structure

```
subbayya_owner/
├── index.html                   # Customer Website Interface
├── styles.css                   # Customer Website Styles
├── app.js                       # Customer App Logic (connected to REST APIs & Socket.IO)
│
├── owner/                       # Owner / Admin Management Application
│   ├── index.html               # Owner Portal Entry & Redirect
│   ├── login.html               # Owner Secure Authentication Page
│   ├── dashboard.html           # Live Operations & Analytics Dashboard
│   ├── orders.html              # Full Order Pipeline & Filtering
│   ├── order-details.html       # Order Inspector & Printable Receipt
│   ├── menu.html                # Food & Rate Card Management
│   ├── customers.html           # Customer Directory & History Modal
│   ├── reports.html             # Sales Analytics & Channel Breakdown
│   ├── settings.html            # Store Open/Closed & Fulfillment Fees
│   ├── css/
│   │   └── owner.css            # Godavari Gold & Dark Slate Theme
│   └── js/
│       ├── auth.js              # Token Manager, Chime & Socket.IO Handler
│       ├── dashboard.js         # Dashboard Metrics & Chart.js Visualizations
│       ├── orders.js            # Orders Management & CSV Exporter
│       ├── order-details.js     # Order Details & Receipt Print
│       ├── menu.js              # Menu CRUD & Live Availability Switch
│       ├── customers.js         # Customer Insights & Order Logs
│       ├── reports.js           # Sales Reporting & Channel Summaries
│       └── settings.js          # Settings & Store Status Controller
│
├── server/                      # Node.js & Express Backend
│   ├── server.js                # Express Server & Socket.IO Hub
│   ├── config/
│   │   └── db.js                # Mongoose Database Connection
│   ├── models/
│   │   ├── User.js              # User Model (Customer / Owner / Staff)
│   │   ├── MenuItem.js          # Menu Items Model
│   │   ├── Order.js             # Order Model with Snapshot Prices
│   │   ├── Setting.js           # Restaurant Global Settings
│   │   └── Counter.js           # Sequence Generator for SGH-10001
│   ├── middleware/
│   │   ├── auth.js              # JWT Token Verification
│   │   └── owner.js             # Role Authorization Check (role === 'owner')
│   ├── controllers/
│   │   ├── authController.js    # Login, Register, Profile, Logout
│   │   ├── menuController.js    # Menu CRUD & Stock Status
│   │   ├── orderController.js   # Order Placement, Status Workflow, Tracking
│   │   ├── customerController.js# Customer Aggregation & Profiles
│   │   ├── dashboardController.js# Real-time Stats, Revenue Trends, Top Items
│   │   └── settingController.js # Global Store Configuration
│   ├── routes/
│   │   ├── auth.js              # /api/auth
│   │   ├── menu.js              # /api/menu
│   │   ├── orders.js            # /api/orders
│   │   ├── customers.js         # /api/customers
│   │   ├── dashboard.js         # /api/dashboard
│   │   └── settings.js          # /api/settings
│   └── utils/
│       ├── seed.js              # Initial Database Seeder
│       └── test_system.js       # 19-Step Automated Verification Suite
│
├── .env                         # Environment Variables (Ignored in Git)
├── .env.example                 # Environment Variables Template
├── .gitignore                   # Git Ignore Configuration
└── package.json                 # Project Metadata & Dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MongoDB**: Local MongoDB instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file (copied from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/subbayya_gari_hotel
JWT_SECRET=your_secure_jwt_secret_here
OWNER_NAME=Subbayya Owner
OWNER_EMAIL=owner@subbayya.com
OWNER_PASSWORD=Subbayya@1950
OWNER_PHONE=+919010888842
NODE_ENV=development
```

### 4. Start the Application
```bash
npm start
```

On first boot, the server will automatically:
1. Connect to MongoDB.
2. Seed the default owner account `owner@subbayya.com`.
3. Seed 24+ authentic Subbayya Gari menu items.
4. Initialize the sequential order counter at `10000`.
5. Initialize default restaurant settings.

---

## 🧪 Automated Testing

Run the full end-to-end 19-step verification test suite:
```bash
node server/utils/test_system.js
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user/owner and issue JWT token
- `POST /api/auth/register` — Register new customer account
- `GET /api/auth/me` — Get current logged-in user profile (Bearer token required)
- `POST /api/auth/logout` — Logout user

### Menu Management (`/api/menu`)
- `GET /api/menu` — Retrieve menu items (Supports query filters: `category`, `search`, `isAvailable`, `isVeg`, `all`)
- `GET /api/menu/:id` — Retrieve single dish details
- `POST /api/menu` — [Owner Only] Create new dish
- `PUT /api/menu/:id` — [Owner Only] Update dish details & pricing
- `PATCH /api/menu/:id/status` — [Owner Only] Toggle In-Stock / Out-of-Stock
- `DELETE /api/menu/:id` — [Owner Only] Soft-delete menu item

### Orders & Tracking (`/api/orders`)
- `POST /api/orders` — Place customer order (Calculates totals securely from DB and emits Socket.IO event)
- `GET /api/orders/track/:orderNumber` — Public real-time order tracking
- `GET /api/orders/:id` — Retrieve order details by ID or order number
- `GET /api/orders` — [Owner Only] Filter orders by status, type, payment, and date range
- `PATCH /api/orders/:id/status` — [Owner Only] Advance status: `Pending` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Out for Delivery` ➔ `Completed` / `Cancelled`
- `PATCH /api/orders/:id/payment` — [Owner Only] Update payment status
- `DELETE /api/orders/:id` — [Owner Only] Cancel order

### Customers (`/api/customers`)
- `GET /api/customers` — [Owner Only] List customers with order count & total lifetime spend
- `GET /api/customers/:id` — [Owner Only] View customer profile & full order history

### Analytics & Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — [Owner Only] Live counts (Today's orders, revenue, pending, preparing, completed, etc.)
- `GET /api/dashboard/revenue` — [Owner Only] Daily revenue timeline for Chart.js
- `GET /api/dashboard/top-items` — [Owner Only] Best-selling dishes computed from real database records
- `GET /api/dashboard/order-summary` — [Owner Only] Breakdown by status, channel, and payment method

### Settings (`/api/settings`)
- `GET /api/settings` — Get store operational settings
- `PUT /api/settings` — [Owner Only] Update hours, fees, UPI IDs, and store open/closed status

---

## 📜 License
© 2026 Subbayya Gari Hotel. All rights reserved.
