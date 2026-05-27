import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition, type DefinitionState, type VersionState } from '../../data/mockData'

// ── State badge ────────────────────────────────────────────────────────────────
function StateBadge({ state, versionState }: { state: DefinitionState; versionState?: VersionState }) {
  if (state === 'Published' && versionState === 'Active')
    return <span className="state-badge active">● Active</span>
  if (state === 'Published' && versionState === 'Inactive')
    return <span className="state-badge inactive">◎ Inactive</span>
  if (state === 'Published')
    return <span className="state-badge published">● Published</span>
  if (state === 'Draft')
    return <span className="state-badge draft">○ Draft</span>
  return <span className="state-badge archived">◎ Archived</span>
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DefinitionList() {
  const { definitions } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState<string>('all')
  const [showAllVersions, setShowAllVersions] = useState(false)

  // ── Family helpers ───────────────────────────────────────────────────────────

  /** One representative per family: Active > Draft (highest v) > Inactive (highest v) > Archived (highest v) */
  const computeLatestPerFamily = (defs: AssetDefinition[]): AssetDefinition[] => {
    const families = new Map<string, AssetDefinition[]>()
    for (const d of defs) {
      const fid = d.baseDefinitionId ?? d.id
      if (!families.has(fid)) families.set(fid, [])
      families.get(fid)!.push(d)
    }
    const result: AssetDefinition[] = []
    families.forEach(members => {
      const active = members.find(d => d.state === 'Published' && d.versionState === 'Active')
      if (active) { result.push(active); return }
      const drafts = members.filter(d => d.state === 'Draft')
      if (drafts.length > 0) { result.push(drafts.sort((a, b) => b.version - a.version)[0]); return }
      const inactive = members.filter(d => d.state === 'Published' && d.versionState === 'Inactive')
      if (inactive.length > 0) { result.push(inactive.sort((a, b) => b.version - a.version)[0]); return }
      const archived = members.filter(d => d.state === 'Archived')
      if (archived.length > 0) { result.push(archived.sort((a, b) => b.version - a.version)[0]); return }
    })
    return result
  }

  const familySize = (def: AssetDefinition): number => {
    const fid = def.baseDefinitionId ?? def.id
    return definitions.filter(d => (d.baseDefinitionId ?? d.id) === fid).length
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  const matchesFilters = (d: AssetDefinition) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      d.manufacturer.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q)
    const matchState =
      filterState === 'all' ||
      (filterState === 'draft'    && d.state === 'Draft') ||
      (filterState === 'active'   && d.state === 'Published' && d.versionState === 'Active') ||
      (filterState === 'inactive' && d.state === 'Published' && d.versionState === 'Inactive') ||
      (filterState === 'archived' && d.state === 'Archived')
    return matchSearch && matchState
  }

  // ── Display list ─────────────────────────────────────────────────────────────
  const displayList: AssetDefinition[] = (() => {
    if (showAllVersions && filterState === 'all') {
      const all = definitions.filter(matchesFilters)
      const families = new Map<string, AssetDefinition[]>()
      for (const d of all) {
        const fid = d.baseDefinitionId ?? d.id
        if (!families.has(fid)) families.set(fid, [])
        families.get(fid)!.push(d)
      }
      const grouped: AssetDefinition[] = []
      families.forEach(members => {
        members.sort((a, b) => b.version - a.version).forEach(m => grouped.push(m))
      })
      return grouped
    }
    if (filterState === 'all') {
      return computeLatestPerFamily(definitions).filter(matchesFilters)
    }
    return definitions.filter(matchesFilters)
  })()

  // ── Tab counts ───────────────────────────────────────────────────────────────
  const totalFamilies = new Set(definitions.map(d => d.baseDefinitionId ?? d.id)).size
  const draftCount    = definitions.filter(d => d.state === 'Draft').length
  const activeCount   = definitions.filter(d => d.state === 'Published' && d.versionState === 'Active').length
  const inactiveCount = definitions.filter(d => d.state === 'Published' && d.versionState === 'Inactive').length
  const archivedCount = definitions.filter(d => d.state === 'Archived').length

  const tabs = [
    { key: 'all',      label: 'All',      count: totalFamilies },
    { key: 'draft',    label: 'Draft',    count: draftCount    },
    { key: 'active',   label: 'Active',   count: activeCount   },
    { key: 'inactive', label: 'Inactive', count: inactiveCount },
    { key: 'archived', label: 'Archived', count: archivedCount },
  ] as const

  const renderedFamilies = new Set<string>()

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Definitions</h1>
          <p className="page-subtitle">Manage standardised asset definitions for the catalog</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/internal/definitions/new')}>
            + New Definition
          </button>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────────── */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-item${filterState === tab.key ? ' active' : ''}`}
            onClick={() => { setFilterState(tab.key); setShowAllVersions(false) }}
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

      {/* ── Command bar ──────────────────────────────────────────────────────── */}
      <div className="search-bar" style={{ alignItems: 'center', marginTop: 12 }}>
        <input
          className="search-input"
          placeholder="Search name, manufacturer, model or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filterState === 'all' && (
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
            <th>State</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayList.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-color-soft-text)' }}>
                No definitions found
              </td>
            </tr>
          )}
          {displayList.map(def => {
            const fid = def.baseDefinitionId ?? def.id
            const isFirstInGroup = showAllVersions && filterState === 'all' && !renderedFamilies.has(fid)
            if (showAllVersions && filterState === 'all') renderedFamilies.add(fid)
            const size    = familySize(def)
            const isCurrent = def.state === 'Published' && def.versionState === 'Active'
            const isDraft   = def.state === 'Draft'

            return (
              <Fragment key={def.id}>
                {/* Family group header — only in All + All Versions mode */}
                {isFirstInGroup && (
                  <tr style={{ background: 'var(--theme-color-ghost-selected)' }}>
                    <td colSpan={6} style={{
                      padding: '6px 14px', fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      color: 'var(--theme-color-soft-text)',
                      borderBottom: '1px solid var(--theme-color-soft-bdr)',
                    }}>
                      {def.name} · {size} version{size !== 1 ? 's' : ''}
                    </td>
                  </tr>
                )}

                <tr
                  className="clickable"
                  style={showAllVersions && filterState === 'all'
                    ? { background: isCurrent ? 'rgba(22,163,74,0.05)' : isDraft ? 'rgba(217,119,6,0.04)' : undefined }
                    : undefined}
                  onClick={() => navigate(`/internal/definitions/${def.id}`)}
                >
                  {/* Name + version count chip */}
                  <td className="link-cell" style={{ paddingLeft: showAllVersions && filterState === 'all' ? 28 : undefined }}>
                    {def.name}
                    {!showAllVersions && filterState === 'all' && size > 1 && (
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
                  </td>

                  <td>{def.category}</td>
                  <td>{def.manufacturer} — {def.model}</td>
                  <td><StateBadge state={def.state} versionState={def.versionState} /></td>
                  <td>v{def.version}</td>

                  <td onClick={e => e.stopPropagation()}>
                    {isDraft ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/internal/definitions/${def.id}`)}
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/internal/definitions/${def.id}`)}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
