import { createContext, useContext, useState, type ReactNode } from 'react'
import { definitions as initialDefinitions, assets as initialAssets, workOrders as initialWorkOrders, type AssetDefinition, type Asset, type WorkOrder, type DefinitionSource } from '../data/mockData'

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
  /**
   * Atomically publishes a Draft definition and deactivates the previously Active
   * version in the same family (HC-6478). The target definition transitions to
   * Published + Active; any sibling that was Published + Active becomes Inactive.
   */
  publishDefinition: (defId: string) => void
  /**
   * Clones a Published+Active definition as a new Draft at version N+1 (HC-6057).
   * Returns the new definition's id so the caller can navigate to it.
   * @param source The ingestion channel for the new draft (default 'manual').
   */
  createNewVersion: (defId: string, source?: DefinitionSource) => string
  /**
   * Archives a definition — sets state to 'Archived', clears versionState, records archivedDate.
   * Asset links are preserved. Mirrors the doArchive logic centralised for reuse (HC-7521).
   */
  archiveDefinition: (defId: string) => void
  /**
   * Publishes a Draft definition as Inactive (HC-NEW). The definition becomes
   * Published but is not the active recommendation — an operator can activate it later.
   */
  publishOnly: (defId: string) => void
  /**
   * Swaps the Active version within a Published family (HC-NEW).
   * The target becomes Active; every other Published sibling becomes Inactive.
   */
  setActiveVersion: (defId: string) => void
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

  /**
   * HC-6478 — Atomic publish: activate the target definition and simultaneously
   * deactivate any sibling that is currently Published+Active. This is done in
   * a single setDefinitions call so there is never a moment with 0 or 2 Active
   * versions in the same family.
   */
  const publishDefinition = (defId: string) => {
    setDefinitions(prev => {
      const def = prev.find(d => d.id === defId)
      if (!def) return prev
      const familyId = def.baseDefinitionId ?? def.id
      return prev.map(d => {
        // Deactivate the current Active sibling
        if (
          d.id !== defId &&
          (d.baseDefinitionId ?? d.id) === familyId &&
          d.state === 'Published' &&
          d.versionState === 'Active'
        ) {
          return { ...d, versionState: 'Inactive' as const }
        }
        // Activate the target definition
        if (d.id === defId) {
          return {
            ...d,
            state: 'Published' as const,
            versionState: 'Active' as const,
            publishedDate: new Date().toISOString().split('T')[0],
          }
        }
        return d
      })
    })
  }

  /**
   * HC-6057 / HC-7259 — Create a new Draft version at N+1.
   * The new definition is a clone of the source with a fresh id, incremented
   * version number, state=Draft, and cleared publish/archive timestamps.
   * @param source Ingestion channel for the new draft (default 'manual').
   * Returns the new definition's id.
   */
  const createNewVersion = (defId: string, source: DefinitionSource = 'manual'): string => {
    let newId = ''
    setDefinitions(prev => {
      const def = prev.find(d => d.id === defId)
      if (!def) return prev
      const familyId = def.baseDefinitionId ?? def.id
      const family = prev.filter(d => (d.baseDefinitionId ?? d.id) === familyId)
      const nextVersion = Math.max(...family.map(d => d.version)) + 1
      newId = `def-${Date.now()}`
      const newDef: AssetDefinition = {
        ...def,
        id: newId,
        version: nextVersion,
        state: 'Draft',
        versionState: undefined,
        source,
        createdDate: new Date().toISOString().split('T')[0],
        publishedDate: undefined,
        archivedDate: undefined,
        baseDefinitionId: familyId,
      }
      return [...prev, newDef]
    })
    return newId
  }

  const publishOnly = (defId: string) => {
    setDefinitions(prev => prev.map(d => {
      if (d.id !== defId) return d
      return {
        ...d,
        state: 'Published' as const,
        versionState: 'Inactive' as const,
        publishedDate: new Date().toISOString().split('T')[0],
      }
    }))
  }

  const setActiveVersion = (defId: string) => {
    setDefinitions(prev => {
      const def = prev.find(d => d.id === defId)
      if (!def) return prev
      const familyId = def.baseDefinitionId ?? def.id
      return prev.map(d => {
        if ((d.baseDefinitionId ?? d.id) === familyId && d.state === 'Published') {
          return { ...d, versionState: d.id === defId ? 'Active' as const : 'Inactive' as const }
        }
        return d
      })
    })
  }

  /**
   * HC-7521 — Centralised archive action.
   * Sets state to 'Archived', clears versionState, records archivedDate.
   */
  const archiveDefinition = (defId: string) => {
    setDefinitions(prev => prev.map(d => {
      if (d.id !== defId) return d
      return {
        ...d,
        state: 'Archived' as const,
        versionState: undefined,
        archivedDate: new Date().toISOString().split('T')[0],
      }
    }))
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
      updateDefinition, addDefinition, publishDefinition, publishOnly, setActiveVersion, createNewVersion, archiveDefinition,
      updateAsset, addAsset,
      toasts, addToast, removeToast,
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
