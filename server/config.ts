// Configuration file for the application

export const PLAYER_LIMITS = {
  // Format name: max players
  "5-a-side": 15,
  "7-a-side": 18,
  "11-a-side": 30
};

export const DEFAULT_CREDITS_PRICE = 1; // $1 per credit
export const DEFAULT_CREDIT_VALUE = 7; // £7 per credit for a game

// Match format settings
export const MATCH_FORMATS = [
  { value: "5-a-side", label: "5-a-side" },
  { value: "7-a-side", label: "7-a-side" },
  { value: "11-a-side", label: "11-a-side" }
];

// Roles in the system
export const USER_ROLES = {
  ADMIN: "admin",
  PLAYER: "player"
};

// Cancellation policy
export const CANCELLATION_POLICY = {
  // Maximum number of cancellations allowed per month
  MAX_CANCELLATIONS_PER_MONTH: 2,
  
  // Minimum hours before match that allows cancellation (in hours)
  MIN_CANCELLATION_HOURS: 6,
  
  // Default refund percentage when cancelling (100 = full refund)
  DEFAULT_REFUND_PERCENTAGE: 100
};

// Notification settings
export const NOTIFICATION_SETTINGS = {
  // Send match reminder X hours before the match
  MATCH_REMINDER_HOURS: 24,
  
  // Default notification settings for users
  DEFAULT_USER_SETTINGS: {
    emailNotifications: true,
    pushNotifications: true,
    matchReminders: true,
    bookingConfirmations: true,
    cancellationAlerts: true,
    teamUpdates: true
  }
};