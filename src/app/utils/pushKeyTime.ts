/**
 * Firebase push-key → timestamp decoder.
 *
 * Firebase push IDs use a custom base-64 alphabet. The first 8 characters
 * encode milliseconds since the Unix epoch, giving us the exact time each
 * record was created — regardless of whether the ESP32's NTP sync succeeded.
 */

const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

/** Decode a Firebase push key into a Date object. */
export function pushKeyToDate(key: string): Date {
  let ts = 0;
  for (let i = 0; i < 8; i++) {
    ts = ts * 64 + PUSH_CHARS.indexOf(key.charAt(i));
  }
  return new Date(ts);
}

/**
 * Derive temporal features from a Firebase reading.
 *
 * If the stored hour/minute/day_of_week are ALL zero (ESP32 NTP failure),
 * we fall back to extracting the real timestamp from the push key.
 */
export function resolveTemporalFields(
  raw: { hour?: number; minute?: number; day_of_week?: number; dayOfWeek?: number },
  pushKey: string | null,
): { hour: number; minute: number; day_of_week: number } {
  let hour        = Number(raw.hour ?? 0);
  let minute      = Number(raw.minute ?? 0);
  let day_of_week = Number(raw.day_of_week ?? raw.dayOfWeek ?? 0);

  // All-zero is the signature of a failed NTP sync on the ESP32.
  // Derive the real time from the push key instead.
  if (hour === 0 && minute === 0 && day_of_week === 0 && pushKey) {
    const d = pushKeyToDate(pushKey);
    hour        = d.getHours();
    minute      = d.getMinutes();
    day_of_week = d.getDay(); // 0 = Sunday, matches C's tm_wday
  }

  return { hour, minute, day_of_week };
}
