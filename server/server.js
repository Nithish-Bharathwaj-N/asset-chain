const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

/* =================================
   MIDDLEWARE
================================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =================================
   STATIC FILES
================================= */

app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* =================================
   ROUTES IMPORT
================================= */

const authRoutes = require("./routes/auth");
const labRoutes = require("./routes/labs");
const inchargeRoutes = require("./routes/incharge");
const equipmentRoutes = require("./routes/equipment");
const requestRoutes = require("./routes/requests");
const notificationRoutes = require("./routes/notifications");

const studentAuth = require("./routes/studentAuth");
const studentRequests = require("./routes/studentRequests");
const labEquipment = require("./routes/labEquipment");

const transportRoutes = require("./routes/transport");
const itAssetsRoutes = require("./routes/itAssets");
const constructionRoutes = require("./routes/construction");

/* =================================
   API ROUTES
================================= */

app.use("/api/auth", authRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/incharge", inchargeRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);

/* STUDENT ROUTES */
app.use("/api/student", studentAuth);
app.use("/api/student", studentRequests);

/* LAB EQUIPMENT */
app.use("/api/lab_equipment", labEquipment);

/* TRANSPORT */
app.use("/api/transport", transportRoutes);

/* IT ASSETS */
app.use("/api/it", itAssetsRoutes);

/* CONSTRUCTION */
app.use("/api/construction", constructionRoutes);

/* =================================
   QR REDIRECT ROUTE
================================= */

app.get("/incharge/request/:id", (req, res) => {
  const requestId = req.params.id;
  res.redirect(`/incharge_request.html?id=${requestId}`);
});

/* =================================
   DEFAULT ROUTE
================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

/* =================================
   CRON JOBS
================================= */

require("./utils/remainder");

/* =================================
   SOCKET.IO SETUP
================================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* =================================
   SERVER START
================================= */

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
