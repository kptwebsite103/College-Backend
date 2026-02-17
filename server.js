require("dotenv").config({ path: __dirname + "/.env" });

const http = require("http");
const app = require("./app");
const startLoaders = require("./loaders");
const logger = require("./config/logger");
const { disconnect: disconnectDb } = require("./config/database");

const PORT = process.env.PORT || 5000;
let server;
let isShuttingDown = false;
const connections = new Set();
let loaders;

// ----------------------------
// Admin user seeding
// ----------------------------
async function seedAdminUser() {
  try {
    const mongoose = require("mongoose");
    const User = require("./modules/users/user.model");
    const bcrypt = require("bcrypt");

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPass123!";

    const existing = await User.findOne({ username: ADMIN_USERNAME });
    if (!existing) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const adminUser = new User({
        username: ADMIN_USERNAME,
        password: hashed,
        firstName: "Admin",
        lastName: "User",
        roles: ["admin"],
      });
      await adminUser.save();
      logger.info(`Created default admin user: ${ADMIN_USERNAME}`);
    } else if (!existing.roles.includes("admin")) {
      existing.roles = Array.from(
        new Set([...(existing.roles || []), "admin"]),
      );
      await existing.save();
      logger.info(`Updated existing user ${ADMIN_USERNAME} with admin role`);
    }
  } catch (e) {
    logger.warn(
      "Admin seeding failed (non-fatal):",
      e && e.message ? e.message : e,
    );
  }
}

// ----------------------------
// Graceful shutdown
// ----------------------------
async function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("Shutting down gracefully...");

  try {
    if (server && server.close) {
      server.close(async (err) => {
        if (err) logger.error("Error closing server:", err);

        // Close WebSocket and database connections
        try {
          if (loaders?.socket?.close) await loaders.socket.close();
          if (disconnectDb) await disconnectDb();
        } catch (e) {
          logger.error("Error during shutdown cleanup:", e);
        }

        logger.info("Shutdown complete. Exiting.");
        process.exit(exitCode);
      });

      // Force destroy remaining connections after timeout
      setTimeout(
        () => {
          logger.warn("Forcing shutdown: destroying open connections");
          connections.forEach((socket) => {
            try {
              socket.destroy();
            } catch (e) {
              /* ignore */
            }
          });
          process.exit(1);
        },
        Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000),
      );
    } else {
      process.exit(exitCode);
    }
  } catch (e) {
    logger.error("Unexpected shutdown error:", e);
    process.exit(1);
  }
}

// ----------------------------
// Start server (local development)
// ----------------------------
async function startServer() {
  try {
    loaders = await startLoaders();

    // Initialize Express app with loaders
    loaders.express.init(app);

    // Seed default admin user (non-blocking if fails)
    await seedAdminUser();

    // Create HTTP server
    server = http.createServer(app);

    // Initialize WebSocket server (local only)
    if (loaders?.socket?.init) loaders.socket.init(server);

    // Track connections for graceful shutdown
    server.on("connection", (socket) => {
      connections.add(socket);
      socket.on("close", () => connections.delete(socket));
    });

    // Start listening
    server.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));

    // Server errors
    server.on("error", (err) => {
      logger.error("Server error:", err);
      shutdown(1);
    });

    // Global error handling
    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION:", err);
      shutdown(1);
    });

    process.on("unhandledRejection", (reason, p) => {
      logger.error("UNHANDLED REJECTION at:", p, "reason:", reason);
      shutdown(1);
    });

    // Graceful shutdown signals
    process.on("SIGINT", () => shutdown(0));
    process.on("SIGTERM", () => shutdown(0));
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// ----------------------------
// Run server if executed directly (local dev)
// ----------------------------
if (require.main === module) {
  startServer();
}

// ----------------------------
// Export app for Vercel serverless
// ----------------------------
module.exports = app;
