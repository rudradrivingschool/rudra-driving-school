
/**
 * Helper function to determine total rides for a given duration.
 */
export function getTotalRidesFromDuration(duration: string): number {
  if (duration === "8 rides/month") return 8;
  if (duration === "15 rides/month") return 15;
  if (duration === "30 rides/month") return 30;
  return 8; // fallback 
}
