/**
 * Returns a time-based greeting string.
 *
 * Pagi  : 05:00 – 11:59
 * Siang : 12:00 – 14:59
 * Sore  : 15:00 – 17:59
 * Malam : 18:00 – 04:59
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Selamat pagi";
  if (hour >= 12 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 15) return "🌤️";
  if (hour >= 15 && hour < 18) return "🌅";
  return "🌙";
}
