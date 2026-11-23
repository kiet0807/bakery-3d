import { create } from 'zustand'
import { createJSONStorage, persist, type PersistStorage, type StateStorage } from 'zustand/middleware'
import {
  DEFAULT_CAKE,
  MAX_TOPPINGS,
  cleanMessage,
  normalizeConfig,
  type CakeConfig,
  type ToppingId,
} from './cake'
import { addItem, removeItem, restoreItems, setQuantity, type CartItem } from './cart'
import type { PresetId } from './presets'

/**
 * localStorage can be missing or throw (private windows, blocked site data, full quota).
 * The shop must keep working then, so storage falls back to memory for the visit.
 */
const memory = new Map<string, string>()
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name) ?? memory.get(name) ?? null
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    memory.set(name, value)
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Keep the in-memory copy only.
    }
  },
  removeItem: (name) => {
    memory.delete(name)
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Nothing to remove.
    }
  },
}

/**
 * JSON over safeStorage that forgives a broken saved value (edited by hand, cut short by a full disk): the value
 * is dropped and the store starts empty. Without this, persist never finishes hydrating on a parse error, and the
 * cart page waits forever behind its loading state.
 */
function forgivingStorage<S>(): PersistStorage<S> {
  const json = createJSONStorage<S>(() => safeStorage) as PersistStorage<S>
  return {
    getItem: (name) => {
      try {
        return json.getItem(name)
      } catch {
        safeStorage.removeItem(name)
        return null
      }
    },
    setItem: (name, value) => json.setItem(name, value),
    removeItem: (name) => json.removeItem(name),
  }
}

interface DesignState {
  config: CakeConfig
  sliced: boolean
  update: (patch: Partial<CakeConfig>) => void
  toggleTopping: (id: ToppingId) => void
  load: (config: CakeConfig) => void
  reset: () => void
  setSliced: (sliced: boolean) => void
}

export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      config: DEFAULT_CAKE,
      sliced: false,
      update: (patch) =>
        set((state) => {
          const config = normalizeConfig({ ...state.config, ...patch })
          // normalizeConfig trims the message, which would eat the space after each word as it is typed
          // ("HappyBirthday"). While typing it keeps the space; the box trims on blur, and the cart, the share
          // link and the saved design all go through normalizeConfig again.
          if (typeof patch.message !== 'string') return { config }
          return { config: { ...config, message: cleanMessage(patch.message) } }
        }),
      toggleTopping: (id) =>
        set((state) => {
          const { toppings } = state.config
          if (toppings.includes(id))
            return { config: { ...state.config, toppings: toppings.filter((t) => t !== id) } }
          if (toppings.length >= MAX_TOPPINGS) return state
          return { config: { ...state.config, toppings: [...toppings, id] } }
        }),
      load: (config) => set({ config: normalizeConfig(config), sliced: false }),
      reset: () => set({ config: DEFAULT_CAKE, sliced: false }),
      setSliced: (sliced) => set({ sliced }),
    }),
    {
      name: 'kais-bakery-design',
      version: 2,
      storage: forgivingStorage(),
      partialize: (state) => ({ config: state.config }),
      merge: (persisted, current) => ({
        ...current,
        config: normalizeConfig((persisted as { config?: unknown } | undefined)?.config ?? current.config),
      }),
      skipHydration: true,
    },
  ),
)

interface CartState {
  items: CartItem[]
  add: (config: CakeConfig, options?: { presetId?: PresetId; snapshot?: string }) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

/** Where the cart is kept in localStorage (CartView's inline script reads it before the first paint). */
export const CART_STORAGE_KEY = 'kais-bakery-cart'

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (config, options) =>
        set((state) => ({
          items: addItem(state.items, normalizeConfig(config), { id: newId(), ...options }),
        })),
      setQuantity: (id, quantity) => set((state) => ({ items: setQuantity(state.items, id, quantity) })),
      remove: (id) => set((state) => ({ items: removeItem(state.items, id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 2,
      storage: forgivingStorage(),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: restoreItems((persisted as { items?: unknown } | undefined)?.items),
      }),
      skipHydration: true,
    },
  ),
)

/** Saved state is read after the first render, so server and browser render the same HTML first. */
export function rehydrateStores() {
  void useDesign.persist.rehydrate()
  void useCart.persist.rehydrate()
}
