import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { DEFAULT_CAKE, MAX_TOPPINGS, normalizeConfig, type CakeConfig, type ToppingId } from './cake'
import { addItem, removeItem, restoreItems, setQuantity, type CartItem } from './cart'

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
      update: (patch) => set((state) => ({ config: normalizeConfig({ ...state.config, ...patch }) })),
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
      name: 'crumb-cloud-design',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
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
  add: (config: CakeConfig, options?: { name?: string; snapshot?: string }) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

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
      name: 'crumb-cloud-cart',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
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
