/** Today's date in Mauritius as YYYY-MM-DD, offset by `days`. */
export function mauritiusDate(days = 0) {
  const now = new Date(Date.now() + days * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Mauritius" }).format(now);
}
