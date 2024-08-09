export default function getFontSize({
  screenWidth,
}: {
  screenWidth: number;
}): number {
  if (screenWidth > 800) {
    return 24; // Large screens
  } else if (screenWidth > 400) {
    return 18; // Medium screens
  } else {
    return 14; // Small screens
  }
}
