const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

let _app = null;

module.exports = {
  /**
   * Initialize express app with common middlewares.
   * This loader is config-only (no business logic, no routes mounting).
   * @param {import('express').Application} app
   */
  init(app) {
    if (_app) return _app;

    if (!app || typeof app.use !== 'function') {
      throw new Error('expressLoader.init requires an Express app instance');
    }

    // Security headers
    app.use(helmet());

    // Request logging (dev-friendly)
    app.use(morgan(process.env.LOG_FORMAT || 'dev'));

    // Enable CORS for configured origins (default to allow all in dev)
    const corsOpts = {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: true,
    };
    app.use(cors(corsOpts));

    // Response compression
    app.use(compression());

    // JSON and URL-encoded parsers
    app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
    app.use(express.urlencoded({ extended: false }));

    _app = app;
    return _app;
  },

  /**
   * Close/cleanup if needed. Middlewares usually don't need cleanup but keep API consistent.
   */
  async close() {
    _app = null;
  },
};