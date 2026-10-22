export function toUtc(wib: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wib)) throw new Error('Enter a valid date and time.')
  const date = new Date(`${wib}:00+07:00`)
  if (!Number.isFinite(date.getTime()) || toWib(date.toISOString()) !== wib)
    throw new Error('Enter a valid date and time.')
  return date.toISOString()
}
export function toWib(utc: string): string {
  return new Date(Date.parse(utc) + 7 * 60 * 60 * 1000).toISOString().slice(0, 16)
}
export function displayTime(utc?: string): string {
  return utc
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(utc)) + ' WIB'
    : 'Not specified'
}
