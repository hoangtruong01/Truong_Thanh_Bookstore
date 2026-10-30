export interface StoreInfo {
  name: string
  hotline: string
  email: string
  address: string
  openingHours: string
  freeShippingThreshold: number
  returnPolicyDays: number
}

const STORAGE_KEY = 'tt_store_info_config'

export const DEFAULT_STORE_INFO: StoreInfo = {
  name: 'Nhà sách Trường Thành',
  hotline: '0982 938 316',
  email: 'giaoductruongthanh@gmail.com',
  address: 'Chợ chanh - Nhân Hà, Ninh Bình',
  openingHours: '07:30 đến 21:30 hàng ngày (bao gồm cả thứ Bảy, Chủ Nhật và ngày lễ)',
  freeShippingThreshold: 299000,
  returnPolicyDays: 7,
}

export function getStoreInfo(): StoreInfo {
  if (typeof window === 'undefined') return { ...DEFAULT_STORE_INFO }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STORE_INFO }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_STORE_INFO,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_STORE_INFO }
  }
}

export function saveStoreInfo(info: Partial<StoreInfo>): StoreInfo {
  const current = getStoreInfo()
  const updated = { ...current, ...info }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('store-info-updated', { detail: updated }))
    } catch (e) {
      console.warn('Failed to persist store info config', e)
    }
  }
  return updated
}
