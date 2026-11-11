/** Payment methods the storefront checkout can offer (mirrors backend PaymentMethod). */
export type CheckoutPaymentMethod = 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO'

export interface PaymentMethodOption {
  value: CheckoutPaymentMethod
  label: string
  description: string
  tag?: string
}

/** Recipient summary shown on the order-success screen. */
export interface CheckoutRecipient {
  fullName: string
  phone: string
  address: string
}
