import { JSDOM } from 'jsdom'
// Node 26 exposes a disabled native localStorage that shadows jsdom in Vitest 1.
const browser = new JSDOM('', { url: 'http://localhost' }).window
for (const key of ['localStorage', 'sessionStorage', 'Storage'] as const) {
  Object.defineProperty(window, key, { configurable: true, value: browser[key] })
  Object.defineProperty(globalThis, key, { configurable: true, value: browser[key] })
}
