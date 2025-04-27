// Configuration file for the application

export const PLAYER_LIMITS = {
  // Format name: max players
  "5-a-side": 15,
  "7-a-side": 18,
  "11-a-side": 30
};

export const DEFAULT_CREDITS_PRICE = 1; // $1 per credit

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