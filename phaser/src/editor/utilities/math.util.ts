export function round(v: number, precision = 100) {
  return Math.round(v * precision) / precision;
}