import type { TransportRequest, RequestInput } from './types'
export interface RequestRepository { list(): Promise<TransportRequest[]>; get(id: string): Promise<TransportRequest | undefined>; create(input: RequestInput): Promise<TransportRequest>; update(id: string, input: RequestInput): Promise<TransportRequest> }
