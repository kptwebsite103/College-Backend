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
    const { createUser, findUserByUsername, updateUser } = require('./modules/users/user.service');

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPass123!";

    const existing = await findUserByUsername(ADMIN_USERNAME);
    if (!existing) {
      await createUser({
        username: ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL || `${ADMIN_USERNAME}@local.dev`,
        password: ADMIN_PASSWORD,
        firstName: "Admin",
        lastName: "User",
        roles: ["admin"],
      });
      logger.info(`Created default admin user: ${ADMIN_USERNAME}`);
    } else if (!existing.roles.includes("admin")) {
      const nextRoles = Array.from(
        new Set([...(existing.roles || []), "admin"]),
      );
      await updateUser(existing._id || existing.id, { roles: nextRoles });
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
    const cleanupAndExit = async () => {
      try {
        if (loaders?.socket?.close) await loaders.socket.close();
        if (disconnectDb) await disconnectDb();
      } catch (e) {
        logger.error("Error during shutdown cleanup:", e);
      }
      logger.info("Shutdown complete. Exiting.");
      process.exit(exitCode);
    };

    if (server && server.close && server.listening) {
      server.close(async (err) => {
        if (err && err.code !== "ERR_SERVER_NOT_RUNNING") {
          logger.error("Error closing server:", err);
        }
        await cleanupAndExit();
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
      await cleanupAndExit();
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
      if (err && err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
      }
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
