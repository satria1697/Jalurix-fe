import { dataSource } from '../../data/repositories'
import type { RequestInput } from './types'
export const DRAFT_KEY = 'jalurix.request-editor.v1'
function draftKey() {
  return dataSource() === 'api' ? 'jalurix.request-editor.api.v1' : DRAFT_KEY
}
export interface RequestDraft {
  version: 1
  input: RequestInput
  pickupLocal: string
  deliveryLocal: string
}
export function saveDraft(draft: RequestDraft) {
  try {
    sessionStorage.setItem(draftKey(), JSON.stringify(draft))
  } catch {
    throw Error(
      'Your draft could not be saved. Keep this page open and try again after enabling browser storage.'
    )
  }
}
export function readDraft(): RequestDraft | undefined {
  try {
    const raw = sessionStorage.getItem(draftKey())
    if (!raw) return
    const x = JSON.parse(raw)
    const strings = (v: any, keys: string[]) => v && keys.every((k) => typeof v[k] === 'string')
    if (
      x.version !== 1 ||
      !strings(x, ['pickupLocal', 'deliveryLocal']) ||
      !strings(x.input, ['customerId', 'channel', 'intakeNotes', 'handling']) ||
      !['phone', 'whatsapp', 'other'].includes(x.input.channel) ||
      !Array.isArray(x.input.cargo)
    )
      throw Error()
    for (const key of ['pickup', 'delivery']) {
      const loc = x.input[key]
      if (
        !strings(loc, ['type', 'address', 'contactName', 'contactPhone', 'instructions']) ||
        !['residential', 'warehouse', 'dealership', 'business', 'other'].includes(loc.type) ||
        ['latitude', 'longitude'].some((k) => loc[k] !== undefined && typeof loc[k] !== 'number')
      )
        throw Error()
    }
    if (
      !x.input.cargo.every(
        (c: any) =>
          strings(c, ['description']) &&
          ['quantity', 'length', 'width', 'height', 'weight'].every(
            (k) => c[k] === undefined || typeof c[k] === 'number'
          )
      )
    )
      throw Error()
    return x
  } catch {
    throw Error(
      'Your previous request draft could not be restored. Your stored draft has been preserved; you can start a fresh request here.'
    )
  }
}
export function clearDraft() {
  try {
    sessionStorage.removeItem(draftKey())
  } catch {
    /* A completed request remains saved even if draft cleanup is blocked. */
  }
}
