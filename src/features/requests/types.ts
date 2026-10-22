export interface CargoItem {
  description: string
  quantity: number
  length?: number
  width?: number
  height?: number
  weight?: number
}
export interface Location {
  type: 'residential' | 'warehouse' | 'dealership' | 'business' | 'other'
  address: string
  contactName: string
  contactPhone: string
  latitude?: number
  longitude?: number
  instructions: string
}
export interface RequestInput {
  customerId: string
  channel: 'phone' | 'whatsapp' | 'other'
  intakeNotes: string
  cargo: CargoItem[]
  pickupAt?: string
  deliveryAt?: string
  handling: string
  pickup: Location
  delivery: Location
}
export interface TransportRequest extends RequestInput {
  id: string
  reference: string
  status: 'draft'
  creator: { id: 'demo-staff'; name: 'Demo staff' }
  createdAt: string
  updatedAt: string
}
