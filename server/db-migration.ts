import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations for newly added fields and tables
 */
export async function runMigrations() {
  console.log("Starting database migrations...");
  
  try {
    // Add new user fields
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS cancellations_this_month INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_cancellation_reset TIMESTAMP,
      ADD COLUMN IF NOT EXISTS notification_settings JSONB
    `);
    console.log("✓ Users table updated");

    // Add new team fields
    await db.execute(sql`
      ALTER TABLE teams 
      ADD COLUMN IF NOT EXISTS credit_value INTEGER DEFAULT 7,
      ADD COLUMN IF NOT EXISTS cancellation_policy JSONB
    `);
    console.log("✓ Teams table updated");

    // Add new booking fields
    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS weather_data JSONB
    `);
    console.log("✓ Bookings table updated");

    // Add new player_bookings fields
    await db.execute(sql`
      ALTER TABLE player_bookings 
      ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
      ADD COLUMN IF NOT EXISTS refund_amount INTEGER,
      ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP
    `);
    console.log("✓ Player bookings table updated");

    // Create notifications table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        booking_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("✓ Notifications table created (if not exists)");

    // Update credit_transactions table type column
    await db.execute(sql`
      ALTER TABLE credit_transactions
      DROP CONSTRAINT IF EXISTS credit_transactions_type_check,
      ADD CONSTRAINT credit_transactions_type_check 
      CHECK (type IN ('purchase', 'booking', 'cancellation', 'refund', 'referral_bonus', 'admin_adjustment'))
    `);
    console.log("✓ Credit transactions constraints updated");

    console.log("✓ All migrations completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}