import moment from 'moment-timezone';

/**
 * Timezone utilities for consistent date handling across the application
 * Supports multiple timezones for global users
 */

export class TimezoneUtil {
  // Default timezone for server operations
  private static readonly DEFAULT_TIMEZONE = 'UTC';
  
  // Common timezones for different regions
  public static readonly COMMON_TIMEZONES = {
    UTC: 'UTC',
    EST: 'America/New_York',
    PST: 'America/Los_Angeles',
    CST: 'America/Chicago',
    MST: 'America/Denver',
    GMT: 'Europe/London',
    CET: 'Europe/Paris',
    JST: 'Asia/Tokyo',
    IST: 'Asia/Kolkata',
    AEST: 'Australia/Sydney'
  };

  /**
   * Convert UTC date to specified timezone
   */
  static toTimezone(date: Date | string, timezone: string = this.DEFAULT_TIMEZONE): moment.Moment {
    return moment.utc(date).tz(timezone);
  }

  /**
   * Convert date from specified timezone to UTC
   */
  static toUTC(date: Date | string, fromTimezone: string): moment.Moment {
    return moment.tz(date, fromTimezone).utc();
  }

  /**
   * Get current time in specified timezone
   */
  static nowInTimezone(timezone: string = this.DEFAULT_TIMEZONE): moment.Moment {
    return moment.tz(timezone);
  }

  /**
   * Calculate deadlines based on match start time (stored in UTC)
   */
  static calculateDeadlines(firstMatchStart: Date | string) {
    // Parse the match start time (should be in UTC)
    const matchStartUTC = moment.utc(firstMatchStart);
    
    // Calculate deadlines in UTC
    const transferDeadline = matchStartUTC.clone().subtract(2, 'hours');
    const purchaseDeadline = matchStartUTC.clone().subtract(5, 'minutes');
    
    // Return as UTC dates for database storage
    return {
      transfer_deadline: transferDeadline.toDate(),
      purchase_deadline: purchaseDeadline.toDate(),
      first_match_start_utc: matchStartUTC.toDate()
    };
  }

  /**
   * Calculate auto-join time based on transfer deadline
   */
  static calculateAutoJoinTime(transferDeadline: Date | string, hoursBefore: number = 2): Date {
    const transferDeadlineUTC = moment.utc(transferDeadline);
    const autoJoinTime = transferDeadlineUTC.clone().subtract(hoursBefore, 'hours');
    return autoJoinTime.toDate();
  }

  /**
   * Format date for API responses (UTC format)
   */
  static formatForAPI(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment.utc(date).format(format);
  }

  /**
   * Format date for display in specific timezone
   */
  static formatForDisplay(date: Date | string, timezone: string, format: string = 'MMM DD, YYYY hh:mm A'): string {
    return this.toTimezone(date, timezone).format(format);
  }

  /**
   * Check if a date is in the past (in specified timezone)
   */
  static isPast(date: Date | string, timezone: string = this.DEFAULT_TIMEZONE): boolean {
    const dateInTimezone = this.toTimezone(date, timezone);
    const nowInTimezone = this.nowInTimezone(timezone);
    return dateInTimezone.isBefore(nowInTimezone);
  }

  /**
   * Get timezone offset for specified timezone
   */
  static getTimezoneOffset(timezone: string): string {
    return moment.tz(timezone).format('Z');
  }

  /**
   * Convert Entity Sport API date to UTC for storage
   */
  static convertEntitySportDate(entityDate: string): Date {
    // Entity Sport provides dates in UTC format: "YYYY-MM-DD HH:mm:ss"
    // Parse as UTC and return Date object for storage
    const utcDate = moment.utc(entityDate, 'YYYY-MM-DD HH:mm:ss');
    return utcDate.toDate();
  }

  /**
   * Get list of common timezones with their display names
   */
  static getCommonTimezones(): Array<{value: string, label: string}> {
    return [
      { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
      { value: 'America/New_York', label: 'EST/EDT (Eastern Time)' },
      { value: 'America/Los_Angeles', label: 'PST/PDT (Pacific Time)' },
      { value: 'America/Chicago', label: 'CST/CDT (Central Time)' },
      { value: 'America/Denver', label: 'MST/MDT (Mountain Time)' },
      { value: 'Europe/London', label: 'GMT/BST (London Time)' },
      { value: 'Europe/Paris', label: 'CET/CEST (Central European Time)' },
      { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
      { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
      { value: 'Australia/Sydney', label: 'AEST/AEDT (Australian Eastern Time)' }
    ];
  }

  /**
   * Detect user's timezone from browser/device
   */
  static detectUserTimezone(): string {
    // This would typically be called from frontend
    // For now, return UTC as default
    return this.DEFAULT_TIMEZONE;
  }
}

export default TimezoneUtil;
