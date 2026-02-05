const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Migration directory
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  try {
    console.log('Running migrations...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpt-website');
    console.log('Connected to MongoDB');

    // Ensure migrations directory exists
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      console.log('Created migrations directory');
      return;
    }

    // Get all migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migrations to run');
      return;
    }

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(MIGRATIONS_DIR, file));

      if (typeof migration.up === 'function') {
        await migration.up();
        console.log(`Migration ${file} completed`);
      } else {
        console.warn(`Migration ${file} does not have an 'up' function`);
      }
    }

    console.log('All migrations completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };