import { describe, expect, it } from 'vitest'
import { DEFAULT_CAKE, normalizeConfig } from '@/lib/cake'
import { PRESETS } from '@/lib/presets'
import { allergenText, cakeName, describeCake } from './cake-text'
import { localeHref, stripLocale } from './config'
import { dictionaries } from './dictionaries'
import { formatMoney } from './format'

describe('localeHref', () => {
  it('leaves Vietnamese paths alone and prefixes English ones', () => {
    expect(localeHref('vi', '/menu')).toBe('/menu')
    expect(localeHref('en', '/menu')).toBe('/en/menu')
    expect(localeHref('en', '/')).toBe('/en')
    expect(localeHref('en', '/?a=1')).toBe('/en?a=1')
    expect(localeHref('en', '/#story')).toBe('/en#story')
    expect(localeHref('en', '/design?preset=taro-dream')).toBe('/en/design?preset=taro-dream')
  })

  it('does not touch outside links', () => {
    expect(localeHref('en', 'https://zalo.me/0347551122')).toBe('https://zalo.me/0347551122')
    expect(localeHref('en', '//example.com')).toBe('//example.com')
    expect(localeHref('en', '#top')).toBe('#top')
  })
})

describe('stripLocale', () => {
  it('removes either language prefix', () => {
    expect(stripLocale('/en/menu')).toBe('/menu')
    expect(stripLocale('/vi/menu')).toBe('/menu')
    expect(stripLocale('/en')).toBe('/')
    expect(stripLocale('/menu')).toBe('/menu')
    expect(stripLocale('/envelope')).toBe('/envelope')
  })
})

describe('formatMoney', () => {
  it('writes đồng the way each audience reads them', () => {
    expect(formatMoney(350_000, 'vi')).toBe('350.000đ')
    expect(formatMoney(1_290_000, 'vi')).toBe('1.290.000đ')
    expect(formatMoney(350_000, 'en')).toBe('350,000 VND')
  })
})

describe('cake text', () => {
  it('names house cakes in each language and falls back to "your design"', () => {
    expect(cakeName('taro-dream', dictionaries.vi)).toBe('Khoai Môn Mộng Mơ')
    expect(cakeName('taro-dream', dictionaries.en)).toBe('Taro Dream')
    expect(cakeName(undefined, dictionaries.vi)).toBe(dictionaries.vi.cake.yourDesign)
  })

  it('describes a cake in one line', () => {
    expect(describeCake(DEFAULT_CAKE, dictionaries.vi)).toBe(
      '16 cm · Vani · Mứt dâu · Hồng dâu · Dâu tây Đà Lạt · Bông kem · Ít ngọt',
    )
    const birthday = normalizeConfig({ ...DEFAULT_CAKE, candles: 2, message: 'Mẹ yêu' })
    expect(describeCake(birthday, dictionaries.en)).toContain('2 candles · “Mẹ yêu”')
  })

  it('lists allergens', () => {
    expect(allergenText(DEFAULT_CAKE, dictionaries.vi)).toBe('Có chứa: trứng, sữa, bột mì (gluten)')
    expect(allergenText(PRESETS[3].config, dictionaries.en)).toContain('tree nuts')
  })

  it('has a name and tagline for every house cake in both languages', () => {
    for (const dict of Object.values(dictionaries))
      for (const preset of PRESETS) {
        expect(dict.cake.presets[preset.id].name.length).toBeGreaterThan(2)
        expect(dict.cake.presets[preset.id].tagline.length).toBeGreaterThan(10)
      }
  })
})
