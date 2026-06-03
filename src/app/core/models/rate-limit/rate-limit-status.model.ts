export interface RateLimitStatusModel {
  userId: number;
  minuteUsage: number;
  minuteLimit: number;
  dailyUsage: number;
  dailyLimit: number;
  resetInSeconds?: number;
  minuteResetInSeconds?: number;
  dailyResetInSeconds?: number;
  minuteResetTimeFormatted?: string;
  dailyResetTimeFormatted?: string;
  blocked: boolean;
}
