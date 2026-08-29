import api from '@/utils/api'
import type { Address, CreateAddressPayload, UpdateAddressPayload } from '@/types'

export const addressService = {
  getAll: async (): Promise<Address[]> => {
    const res = await api.get('/addresses')
    return res.data.data || res.data
  },

  getById: async (id: string): Promise<Address> => {
    const res = await api.get(`/addresses/${id}`)
    return res.data.data || res.data
  },

  getDefault: async (): Promise<Address | null> => {
    const res = await api.get('/addresses/default')
    return res.data.data || res.data
  },

  create: async (data: CreateAddressPayload): Promise<Address> => {
    const res = await api.post('/addresses', data)
    return res.data.data || res.data
  },

  update: async (id: string, data: UpdateAddressPayload): Promise<Address> => {
    const res = await api.put(`/addresses/${id}`, data)
    return res.data.data || res.data
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/addresses/${id}`)
    return res.data.data || res.data
  },

  setDefault: async (id: string): Promise<Address> => {
    const res = await api.put(`/addresses/${id}/default`)
    return res.data.data || res.data
  },
}
