export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  teamId: number | null;
  isActive: boolean;
  credits: number | null;
  referralCode: string | null;
  notificationSettings: any;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface Team {
  id: number;
  name: string;
  ownerId: number;
  createdAt: Date;
  subscription: string | null;
  allowPlayerRegistration: boolean | null;
  allowPlayerBookingManagement: boolean | null;
  invitationCode: string | null;
  creditValue: number | null;
  cancellationPolicy: any;
}

export interface Booking {
  id: number;
  teamId: number;
  title: string;
  location: string;
  format: string;
  startTime: Date;
  endTime: Date;
  totalSlots: number;
  availableSlots: number;
  isRecurring: boolean | null;
  creditCost: number | null;
  weatherData: any;
  status: string;
  cancelReason: string | null;
  createdAt: Date;
}

export interface PlayerBooking {
  id: number;
  bookingId: number;
  playerId: number;
  status: string;
  cancellationReason: string | null;
  refundAmount: number | null;
  canceledAt: Date | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreditTransaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  teamOwnerId: number | null;
  bookingId: number | null;
  createdAt: Date;
}

export interface CalendarIntegration {
  id: number;
  userId: number;
  provider: string;
  refreshToken: string;
  accessToken: string;
  tokenExpiry: Date;
  createdAt: Date;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  createdAt: Date;
}

export interface PlayerAchievement {
  achievementId: number;
  playerId: number;
  earnedAt: Date;
}

export interface MatchStats {
  id: number;
  bookingId: number;
  teamScore: number | null;
  opponentScore: number | null;
  isWin: boolean | null;
  isDraw: boolean | null;
  isLoss: boolean | null;
  createdAt: Date;
}

export interface PlayerStats {
  id: number;
  bookingId: number;
  playerId: number;
  goals: number | null;
  assists: number | null;
  yellowCards: number | null;
  redCards: number | null;
  minutesPlayed: number | null;
  isInjured: boolean | null;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = "admin",
  PLAYER = "player",
  OWNER = "owner"
}