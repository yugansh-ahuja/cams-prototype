import { Fragment, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition, type DefinitionSource } from '../../data/mockData'

// ── Source chip ────────────────────────────────────────────────────────────────
const sourceLabel: Record<DefinitionSource, string> = {
  manual: 'Manual',
  'csv-import': 'CSV',
  'api-ingestion': 'API',
  'manufacturer-portal': 'Manufacturer',
}
const sourceColor: Record<DefinitionSource, string> = {
  manual: '#6b7280',
  'csv-import': '#0066cc',
  'api-ingestion': '#7c3aed',
  'manufacturer-portal': '#059669',
}
function SourceChip({ source }: { source: DefinitionSource }) {
  const c = sourceColor[source]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600,
      color: c, background: `${c}18`,
      borderRadius: 4, padding: '2px 7px',
      border: `1px solid ${c}30`, whiteSpace: 'nowrap',
    }}>
      {sourceLabel[source]}
    </span>
  )
}

// ── Status badge (lifecycle state only — no Active/Inactive sub-state) ────────
function StatusBadge({ state }: { state: AssetDefinition['state'] }) {
  if (state === 'Draft')    return <span className="state-badge draft">○ Draft</span>
  if (state === 'Archived') return <span className="state-badge archived">◎ Archived</span>
  return <span className="state-badge published">● Published</span>
}

// ── Confirmation modal ─────────────────────────────────────────────────────────
function ConfirmModal({
  title, body, confirmLabel, confirmClass = 'btn-primary',
  onConfirm, onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  confirmClass?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 600 }}>{title}</span>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, lineHeight: 1.55, color: 'var(--theme-color-std-text)' }}>{body}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'published' | 'unpublished' | 'archived'

export default function DefinitionList() {
  const { definitions, publishDefinition, publishOnly, setActiveVersion, archiveDefinition } = useApp()
  const navigate = useNavigate()
  const [search, setSearch]             = useState('')
  const [filterState, setFilterState]   = useState<FilterKey>('all')
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [openKebab, setOpenKebab]       = useState<string | null>(null)
  const [kebabPos, setKebabPos]         = useState<{ top: number; right: number } | null>(null)
  const [addMenuOpen, setAddMenuOpen]   = useState(false)

  // Modal state
  const [pendingActivate, setPendingActivate]               = useState<string | null>(null)
  const [pendingPublishOnly, setPendingPublishOnly]         = useState<string | null>(null)
  const [pendingPublishActivate, setPendingPublishActivate] = useState<string | null>(null)
  const [pendingArchive, setPendingArchive]                 = useState<string | null>(null)

  // Close kebab on outside click or scroll
  useEffect(() => {
    if (!openKebab) return
    const close = () => { setOpenKebab(null); setKebabPos(null) }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [openKebab])

  // Close add-menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return
    const close = () => setAddMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [addMenuOpen])

  // ── Family helpers ───────────────────────────────────────────────────────────
  const familyId = (def: AssetDefinition) => def.baseDefinitionId ?? def.id

  const familySize = (def: AssetDefinition) =>
    definitions.filter(d => familyId(d) === familyId(def)).length

  const publishedFamilySize = (def: AssetDefinition) =>
    definitions.filter(d => familyId(d) === familyId(def) && d.state === 'Published').length

  const computeLatestPerFamily = (defs: AssetDefinition[]): AssetDefinition[] => {
    const map = new Map<string, AssetDefinition[]>()
    for (const d of defs) {
      const fid = familyId(d)
      if (!map.has(fid)) map.set(fid, [])
      map.get(fid)!.push(d)
    }
    const result: AssetDefinition[] = []
    map.forEach(members => {
      const active = members.find(d => d.state === 'Published' && d.versionState === 'Active')
      if (active) { result.push(active); return }
      const drafts = members.filter(d => d.state === 'Draft')
      if (drafts.length) { result.push(drafts.sort((a, b) => b.version - a.version)[0]); return }
      const inactive = members.filter(d => d.state === 'Published' && d.versionState === 'Inactive')
      if (inactive.length) { result.push(inactive.sort((a, b) => b.version - a.version)[0]); return }
      const archived = members.filter(d => d.state === 'Archived')
      if (archived.length) { result.push(archived.sort((a, b) => b.version - a.version)[0]); return }
    })
    return result
  }

  // ── Tab counts ───────────────────────────────────────────────────────────────
  const totalFamilies    = new Set(definitions.map(d => familyId(d))).size
  const publishedCount   = definitions.filter(d => d.state === 'Published').length
  const unpublishedCount = definitions.filter(d => d.state === 'Draft').length
  const archivedCount    = definitions.filter(d => d.state === 'Archived').length

  const tabs = [
    { key: 'all' as FilterKey,         label: 'All',         count: totalFamilies   },
    { key: 'published' as FilterKey,   label: 'Published',   count: publishedCount  },
    { key: 'unpublished' as FilterKey, label: 'Unpublished', count: unpublishedCount },
    { key: 'archived' as FilterKey,    label: 'Archived',    count: archivedCount   },
  ]

  // ── Search filter ────────────────────────────────────────────────────────────
  const matchesSearch = (d: AssetDefinition) => {
    const q = search.toLowerCase()
    return !q ||
      d.name.toLowerCase().includes(q) ||
      d.manufacturer.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q)
  }

  // ── Display list ─────────────────────────────────────────────────────────────
  const displayList: AssetDefinition[] = (() => {
    if (filterState === 'published') {
      const allPub = definitions.filter(d => d.state === 'Published' && matchesSearch(d))
      if (!showAllVersions) {
        // Collapsed: one row per family — active published version, or latest if none
        const map = new Map<string, AssetDefinition[]>()
        for (const d of allPub) {
          const fid = familyId(d)
          if (!map.has(fid)) map.set(fid, [])
          map.get(fid)!.push(d)
        }
        const result: AssetDefinition[] = []
        map.forEach(members => {
          const active = members.find(d => d.versionState === 'Active')
          result.push(active ?? members.sort((a, b) => b.version - a.version)[0])
        })
        return result
      }
      // Expanded: all published versions, grouped by family
      return allPub.sort((a, b) => {
        const fa = familyId(a), fb = familyId(b)
        if (fa !== fb) return fa.localeCompare(fb)
        return b.version - a.version
      })
    }
    if (filterState === 'unpublished') {
      return definitions.filter(d => d.state === 'Draft' && matchesSearch(d))
    }
    if (filterState === 'archived') {
      return definitions.filter(d => d.state === 'Archived' && matchesSearch(d))
    }
    // All tab
    if (showAllVersions) {
      const all = definitions.filter(matchesSearch)
      const map = new Map<string, AssetDefinition[]>()
      for (const d of all) {
        const fid = familyId(d)
        if (!map.has(fid)) map.set(fid, [])
        map.get(fid)!.push(d)
      }
      const grouped: AssetDefinition[] = []
      map.forEach(members => members.sort((a, b) => b.version - a.version).forEach(m => grouped.push(m)))
      return grouped
    }
    return computeLatestPerFamily(definitions).filter(matchesSearch)
  })()

  // ── Column layout ────────────────────────────────────────────────────────────
  // Active (radio) only makes sense when multiple versions are visible — expanded view only
  const showActiveCol = showAllVersions && (filterState === 'all' || filterState === 'published')
  const colCount = showActiveCol ? 8 : 7

  // ── Helper ───────────────────────────────────────────────────────────────────
  const getDef = (id: string) => definitions.find(d => d.id === id)

  // Rendered family tracking
  const renderedFamilies = new Set<string>()

  const kebabItemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '7px 14px', fontSize: 13,
    color: 'var(--theme-color-std-text)',
    background: 'none', border: 'none', cursor: 'pointer',
    borderRadius: 0,
  }

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Definitions</h1>
          <p className="page-subtitle">Manage standardised asset definitions for the catalog</p>
        </div>
        <div className="page-actions" style={{ position: 'relative' }}>
          <button
            className="btn btn-primary"
            onClick={() => setAddMenuOpen(v => !v)}
          >
            + New Definition ▾
          </button>
          {addMenuOpen && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--theme-color-bg)', border: '1px solid var(--theme-color-border)',
                borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100,
                minWidth: 180, overflow: 'hidden',
              }}
            >
              <button
                className="btn btn-ghost"
                style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '10px 16px' }}
                onClick={() => { setAddMenuOpen(false); navigate('/internal/definitions/new') }}
              >
                Add Manually
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '10px 16px' }}
                onClick={() => { setAddMenuOpen(false); navigate('/internal/definitions/import') }}
              >
                Bulk Import (CSV)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────────── */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-item${filterState === tab.key ? ' active' : ''}`}
            onClick={() => {
              setFilterState(tab.key)
              // Published defaults to expanded so the Active column and family grouping are visible immediately
              setShowAllVersions(tab.key === 'published')
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 600,
              background: filterState === tab.key ? 'rgba(0,102,204,0.1)' : 'var(--theme-color-ghost-selected)',
              color: filterState === tab.key ? 'var(--primary)' : 'var(--theme-color-soft-text)',
              borderRadius: 10, padding: '1px 6px', display: 'inline-block',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Published tab info banner — only in expanded view ────────────────── */}
      {filterState === 'published' && showAllVersions && (
        <div style={{
          marginTop: 12, padding: '9px 14px',
          background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.18)',
          borderRadius: 6, fontSize: 13, color: 'var(--theme-color-std-text)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>ⓘ</span>
          <span>Use the radio button to set which version customers see when creating a new asset. Only one version per definition family can be <strong>Active</strong> at a time.</span>
        </div>
      )}

      {/* ── Command bar ──────────────────────────────────────────────────────── */}
      <div className="search-bar" style={{ alignItems: 'center', marginTop: 12 }}>
        <input
          className="search-input"
          placeholder="Search name, manufacturer, model or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* Toggle available on All and Published tabs — Unpublished/Archived have no version grouping to collapse */}
        {(filterState === 'all' || filterState === 'published') && (
          <button
            className={`btn btn-sm ${showAllVersions ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setShowAllVersions(v => !v)}
          >
            {showAllVersions ? '⊟ Collapse' : '⊞ All Versions'}
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Manufacturer / Model</th>
            <th>Status</th>
            {showActiveCol && (
              <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Active</th>
            )}
            <th>Version</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayList.length === 0 && (
            <tr>
              <td colSpan={colCount} style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-color-soft-text)' }}>
                No definitions found
              </td>
            </tr>
          )}

          {displayList.map(def => {
            const fid     = familyId(def)
            const isDraft = def.state === 'Draft'

            // All tab — group header only in expanded view
            const isFirstInGroup = filterState === 'all' && showAllVersions && !renderedFamilies.has(fid)
            if (filterState === 'all' && showAllVersions) renderedFamilies.add(fid)

            // Published tab — family group header only in expanded view
            const isFirstPublishedInFamily = filterState === 'published' && showAllVersions && !renderedFamilies.has(fid)
            if (filterState === 'published' && showAllVersions) renderedFamilies.add(fid)

            const size = familySize(def)
            const pubSize = publishedFamilySize(def)

            return (
              <Fragment key={def.id}>
                {/* All-versions group header */}
                {isFirstInGroup && (
                  <tr style={{ background: 'var(--theme-color-ghost-selected)' }}>
                    <td colSpan={colCount} style={{
                      padding: '6px 14px', fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      color: 'var(--theme-color-soft-text)',
                      borderBottom: '1px solid var(--theme-color-soft-bdr)',
                    }}>
                      {def.name} · {size} version{size !== 1 ? 's' : ''}
                    </td>
                  </tr>
                )}

                {/* Published tab family separator (expanded only) */}
                {isFirstPublishedInFamily && (
                  <tr style={{ background: 'var(--theme-color-ghost-selected)' }}>
                    <td colSpan={colCount} style={{
                      padding: '6px 14px', fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      color: 'var(--theme-color-soft-text)',
                      borderBottom: '1px solid var(--theme-color-soft-bdr)',
                    }}>
                      {def.name}
                    </td>
                  </tr>
                )}

                <tr
                  className="clickable"
                  style={{
                    ...((showAllVersions && (filterState === 'all' || filterState === 'published'))
                      ? {
                          background: def.state === 'Published' && def.versionState === 'Active'
                            ? 'rgba(22,163,74,0.04)'
                            : isDraft ? 'rgba(217,119,6,0.04)' : undefined,
                        }
                      : {}),
                  }}
                  onClick={() => navigate(`/internal/definitions/${def.id}`)}
                >
                  {/* Name */}
                  <td className="link-cell" style={{ paddingLeft: showAllVersions && (filterState === 'all' || filterState === 'published') ? 28 : undefined }}>
                    {def.name}
                    {/* "X versions" badge on collapsed All tab */}
                    {filterState === 'all' && !showAllVersions && size > 1 && (
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        background: 'var(--theme-color-ghost-selected)',
                        border: '1px solid var(--theme-color-soft-bdr)',
                        borderRadius: 10, padding: '1px 7px',
                        color: 'var(--theme-color-soft-text)', fontWeight: 600,
                      }}>
                        {size} versions
                      </span>
                    )}
                    {/* "X published" badge on collapsed Published tab */}
                    {filterState === 'published' && !showAllVersions && pubSize > 1 && (
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        background: 'var(--theme-color-ghost-selected)',
                        border: '1px solid var(--theme-color-soft-bdr)',
                        borderRadius: 10, padding: '1px 7px',
                        color: 'var(--theme-color-soft-text)', fontWeight: 600,
                      }}>
                        {pubSize} published
                      </span>
                    )}
                  </td>

                  <td>{def.category}</td>
                  <td>{def.manufacturer} — {def.model}</td>

                  {/* Status — lifecycle state only */}
                  <td><StatusBadge state={def.state} /></td>

                  {/* Active — radio only in expanded view (multiple versions visible) */}
                  {showActiveCol && (
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {def.state === 'Published' && (
                        <input
                          type="radio"
                          name={`active-${fid}`}
                          checked={def.versionState === 'Active'}
                          onChange={() => setPendingActivate(def.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: 16, height: 16 }}
                        />
                      )}
                    </td>
                  )}

                  <td>v{def.version}</td>
                  <td><SourceChip source={def.source} /></td>

                  {/* Kebab actions */}
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement
                        const rect = btn.getBoundingClientRect()
                        if (openKebab === def.id) {
                          setOpenKebab(null)
                          setKebabPos(null)
                        } else {
                          setOpenKebab(def.id)
                          setKebabPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                        }
                      }}
                      style={{ padding: '3px 10px', fontSize: 18, lineHeight: 1, fontWeight: 700 }}
                      title="Actions"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>

      {/* ── Kebab dropdown — rendered via portal to escape all stacking contexts ── */}
      {openKebab && kebabPos && createPortal((() => {
        const d = getDef(openKebab)
        if (!d) return null
        const isDraftKebab = d.state === 'Draft'
        return (
          <div
            style={{
              position: 'fixed', top: kebabPos.top, right: kebabPos.right, zIndex: 9999,
              background: 'var(--surface)',
              border: '1px solid var(--theme-color-soft-bdr)',
              borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 176, padding: '4px 0',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              style={kebabItemStyle}
              onClick={() => { setOpenKebab(null); setKebabPos(null); navigate(`/internal/definitions/${d.id}`) }}
            >
              View
            </button>
            {isDraftKebab && (
              <>
                <button
                  style={kebabItemStyle}
                  onClick={() => { setOpenKebab(null); setKebabPos(null); setPendingPublishOnly(d.id) }}
                >
                  Publish
                </button>
                <button
                  style={{ ...kebabItemStyle, fontWeight: 600, color: 'var(--primary)' }}
                  onClick={() => { setOpenKebab(null); setKebabPos(null); setPendingPublishActivate(d.id) }}
                >
                  Publish &amp; Activate
                </button>
              </>
            )}
            {(d.state === 'Published' || d.state === 'Draft') && (
              <>
                <div style={{ borderTop: '1px solid var(--theme-color-soft-bdr)', margin: '4px 0' }} />
                <button
                  style={{ ...kebabItemStyle, color: '#dc2626' }}
                  onClick={() => { setOpenKebab(null); setKebabPos(null); setPendingArchive(d.id) }}
                >
                  Archive
                </button>
              </>
            )}
          </div>
        )
      })(), document.body)}

      {/* ── Set Active Version modal ──────────────────────────────────────────── */}
      {pendingActivate && (() => {
        const d = getDef(pendingActivate)!
        return (
          <ConfirmModal
            title="Set active version"
            body={`Activating v${d.version} of "${d.name}" will make it the recommended version shown to customers when creating a new asset of this type. The current active version will become inactive.`}
            confirmLabel="Set as Active"
            confirmClass="btn-primary"
            onConfirm={() => { setActiveVersion(pendingActivate); setPendingActivate(null) }}
            onCancel={() => setPendingActivate(null)}
          />
        )
      })()}

      {/* ── Publish Only modal ────────────────────────────────────────────────── */}
      {pendingPublishOnly && (() => {
        const d = getDef(pendingPublishOnly)!
        return (
          <ConfirmModal
            title="Publish version"
            body={`v${d.version} of "${d.name}" will be published as an inactive version. It won't be shown as the active recommendation yet. You can activate it at any time from the Published tab.`}
            confirmLabel="Publish"
            confirmClass="btn-secondary"
            onConfirm={() => { publishOnly(pendingPublishOnly); setPendingPublishOnly(null) }}
            onCancel={() => setPendingPublishOnly(null)}
          />
        )
      })()}

      {/* ── Publish & Activate modal ──────────────────────────────────────────── */}
      {pendingPublishActivate && (() => {
        const d = getDef(pendingPublishActivate)!
        return (
          <ConfirmModal
            title="Publish and activate"
            body={`v${d.version} of "${d.name}" will be published and set as the active recommendation. Any currently active version in this family will become inactive.`}
            confirmLabel="Publish & Activate"
            confirmClass="btn-primary"
            onConfirm={() => { publishDefinition(pendingPublishActivate); setPendingPublishActivate(null) }}
            onCancel={() => setPendingPublishActivate(null)}
          />
        )
      })()}

      {/* ── Archive modal ─────────────────────────────────────────────────────── */}
      {pendingArchive && (() => {
        const d = getDef(pendingArchive)!
        return (
          <ConfirmModal
            title="Archive definition"
            body={`Archiving v${d.version} of "${d.name}" will remove it from the customer catalog. Existing asset links are preserved but no new assets can be created from this version.`}
            confirmLabel="Archive"
            confirmClass="btn-danger"
            onConfirm={() => { archiveDefinition(pendingArchive); setPendingArchive(null) }}
            onCancel={() => setPendingArchive(null)}
          />
        )
      })()}
    </>
  )
}
