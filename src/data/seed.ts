import type { Database } from './database'
import { emptyRequest } from '../features/requests/validation'
export function seed(): Database {
  const stamp = '2026-10-22T02:00:00.000Z'
  return {
    version: 1, nextRequestNumber: 4,
    customers: [
      { id: 'sample-c1', type: 'business', name: 'Rimba Motor Collective', phone: '+62 812 0000 0101', email: 'hello@example.com', address: 'Jl. Taman Rimba No. 12, Jakarta Selatan', createdAt: stamp, updatedAt: stamp },
      { id: 'sample-c2', type: 'individual', name: 'Aruna Pratama', phone: '+62 812 0000 0102', email: '', address: 'Jl. Daun Teduh No. 8, Bandung', createdAt: stamp, updatedAt: stamp },
      { id: 'sample-c3', type: 'business', name: 'Bumi Auto Studio', phone: '+62 812 0000 0103', email: 'studio@example.com', address: 'Jl. Hutan Kota No. 24, Surabaya', createdAt: stamp, updatedAt: stamp }
    ],
    requests: [
      ['sample-r1', 'sample-c1', 'Jakarta Selatan', 'Bandung', 'Honda CB150R', 4],
      ['sample-r2', 'sample-c2', 'Bandung', 'Yogyakarta', 'Toyota Yaris', 1],
      ['sample-r3', 'sample-c3', 'Surabaya', 'Jakarta Selatan', 'Vespa Primavera', 2]
    ].map(([id, customerId, origin, destination, description, quantity], i) => ({
      ...emptyRequest(), id: String(id), customerId: String(customerId), reference: `REQ-00000${i + 1}`, status: 'draft', creator: { id: 'demo-staff', name: 'Demo staff' }, createdAt: stamp, updatedAt: stamp,
      cargo: [{ description: String(description), quantity: Number(quantity) }],
      pickup: { ...emptyRequest().pickup, type: 'dealership', address: `Sample pickup location, ${origin}`, contactName: 'Demo pickup contact' },
      delivery: { ...emptyRequest().delivery, type: 'warehouse', address: `Sample delivery location, ${destination}`, contactName: 'Demo delivery contact' },
      pickupAt: `2026-10-${24 + i}T02:00:00.000Z`, deliveryAt: `2026-10-${25 + i}T09:00:00.000Z`, handling: 'Keep upright. Secure with padded straps.'
    }))
  }
}
