import flashSaleBg from '@/assets/flash-sale-bg.webp'
import sgkBg from '@/assets/sgk-bg.webp'
import doChoiBg from '@/assets/do-choi-bg.webp'
import comboBg from '@/assets/combo-bg.webp'
import truyenTranhBg from '@/assets/truyen-tranh-bg.webp'
import sachThamKhaoBg from '@/assets/sach-tham-khao-bg.webp'
import doLuuNiemBg from '@/assets/do-luu-niem-bg.webp'
import inspirationBg from '@/assets/inspiration-bg.webp'
import flashSaleBgAvif from '@/assets/flash-sale-bg.avif'
import sgkBgAvif from '@/assets/sgk-bg.avif'
import doChoiBgAvif from '@/assets/do-choi-bg.avif'
import comboBgAvif from '@/assets/combo-bg.avif'
import truyenTranhBgAvif from '@/assets/truyen-tranh-bg.avif'
import sachThamKhaoBgAvif from '@/assets/sach-tham-khao-bg.avif'
import doLuuNiemBgAvif from '@/assets/do-luu-niem-bg.avif'
import inspirationBgAvif from '@/assets/inspiration-bg.avif'

/** Home page section backgrounds (webp URLs; the AVIF twin is resolved by `optimizedBackground`). */
export const homeBackgrounds = {
  flashSale: flashSaleBg,
  sgk: sgkBg,
  doChoi: doChoiBg,
  combo: comboBg,
  truyenTranh: truyenTranhBg,
  sachThamKhao: sachThamKhaoBg,
  doLuuNiem: doLuuNiemBg,
  inspiration: inspirationBg,
} as const

const avifByWebp = new Map<string, string>([
  [flashSaleBg, flashSaleBgAvif],
  [sgkBg, sgkBgAvif],
  [doChoiBg, doChoiBgAvif],
  [comboBg, comboBgAvif],
  [truyenTranhBg, truyenTranhBgAvif],
  [sachThamKhaoBg, sachThamKhaoBgAvif],
  [doLuuNiemBg, doLuuNiemBgAvif],
  [inspirationBg, inspirationBgAvif],
])

/** CSS `background-image` value preferring AVIF with a WebP fallback when an AVIF twin exists. */
export function optimizedBackground(webp: string): string {
  const avif = avifByWebp.get(webp)
  return avif
    ? `image-set(url("${avif}") type("image/avif"), url("${webp}") type("image/webp"))`
    : `url("${webp}")`
}
