import api from '@/utils/api'

export const bannerService = {
  getActive() {
    return api.get('/banners/active')
  },
  getAll() {
    return api.get('/banners')
  },
  create(data: any) {
    return api.post('/banners', data)
  },
  update(id: string, data: any) {
    return api.patch(`/banners/${id}`, data)
  },
  delete(id: string) {
    return api.delete(`/banners/${id}`)
  },
}
