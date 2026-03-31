# AssetChain — Transport Module Setup Guide

## ✅ Step-by-Step Setup

### Step 1 — Import the databases (MySQL)

Open MySQL Workbench (or phpMyAdmin or terminal) and run these **two files in order**:

```
1. database/schema.sql          ← Run this first (creates asset_management DB)
2. database/transport_schema.sql ← Run this second (adds transport tables)
```

**In MySQL terminal:**
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/transport_schema.sql
```

**Or in MySQL Workbench:**
- File → Open SQL Script → select `schema.sql` → Run ▶
- File → Open SQL Script → select `transport_schema.sql` → Run ▶

---

### Step 2 — Configure DB connection

Edit `server/db/connection.js` and set your MySQL credentials:

```js
const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',         // ← your MySQL username
  password: 'yourpassword', // ← your MySQL password
  database: 'asset_management'
});
```

---

### Step 3 — Install dependencies & start server

```bash
npm install
node server/server.js
```

Server runs on: **http://localhost:3000**

---

## 🗄️ Transport Tables Created

| Table                    | Purpose                        |
|--------------------------|--------------------------------|
| `transport_drivers`      | Driver profiles & licenses     |
| `buses`                  | Bus details                    |
| `bus_routes`             | Route info (name, code, path)  |
| `route_stops`            | Stops per route                |
| `bus_route_assignments`  | Which bus runs which route     |
| `rc_book_details`        | RC documents per bus           |
| `bus_insurance`          | Insurance policies             |
| `bus_fitness_certificate`| Fitness certificates           |
| `bus_pollution_certificate`| PUC certificates             |
| `bus_maintenance`        | Service & repair history       |
| `bus_fuel_log`           | Fuel fill-up records           |

---

## 🚌 How to Add Data (Admin — Head Dashboard)

After setup, log in as head/admin and go to **Transport** in the dashboard.

**Correct order to add data:**

1. **Drivers** (`/transport_drivers.html`) — Add drivers first
2. **Buses** (`/transport_buses.html`) — Add buses, assign a driver
3. **Routes** (`/transport_routes.html`) — Create routes
4. **Bus Stops** (`/transport_stops.html`) — Add stops to routes
5. **Assign Route to Bus** — In Bus Details page, assign the route to the bus

---

## 👨‍🎓 Student View

Students log in → Dashboard → Transport  
They see all buses → click a bus to expand its route → click the route to see all stops.

---

## 🔑 Admin Login (default)

Check `database/schema.sql` for default admin credentials or register via the signup page.
