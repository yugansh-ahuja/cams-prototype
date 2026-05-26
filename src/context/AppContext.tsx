import { createContext, useContext, useState, type ReactNode } from 'react'
import { definitions as initialDefinitions, assets as initialAssets, workOrders as initialWorkOrders, type AssetDefinition, type Asset, type WorkOrder } from '../data/mockData'

export type Persona = 'internal-admin' | 'customer-admin' | 'technician' | null

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface AppContextType {
  persona: Persona
  setPersona: (p: Persona) => void
  definitions: AssetDefinition[]
  assets: Asset[]
  workOrders: WorkOrder[]
  updateDefinition: (def: AssetDefinition) => void
  addDefinition: (def: AssetDefinition) => void
  updateAsset: (asset: Asset) => void
  addAsset: (asset: Asset) => void
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>(null)
  const [definitions, setDefinitions] = useState<AssetDefinition[]>(initialDefinitions)
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [workOrders] = useState<WorkOrder[]>(initialWorkOrders)
  const [toasts, setToasts] = useState<Toast[]>([])

  const updateDefinition = (updated: AssetDefinition) => {
    setDefinitions(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  const addDefinition = (def: AssetDefinition) => {
    setDefinitions(prev => [...prev, def])
  }

  const updateAsset = (updated: Asset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  const addAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset])
  }

  const addToast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <AppContext.Provider value={{
      persona, setPersona,
      definitions, assets, workOrders,
      updateDefinition, addDefinition, updateAsset, addAsset,
      toasts, addToast, removeToast
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
