import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition, type DefinitionState, type DefinitionSource, type VersionState } from '../../data/mockData'

// ── Source chip ────────────────────────────────────────────────────────────────
function SourceChip({ source }: { source: DefinitionSource }) {
  const cfg: Record<DefinitionSource, { label: string; color: string }> = {
    manual:                { label: 'Manual',       color: '#6366f1' },
    'csv-import':          { label: 'CSV Import',   color: '#0891b2' },
    'api-ingestion':       { label: 'API Ingest',   color: '#7c3aed' },
    'manufacturer-portal': { label: 'Manufacturer', color: '#059669' },
  }
  const { label, color } = cfg[source]
  return (
    <span style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 10,
      background: `${color}18`, color, border: `1px solid ${color}40`,
      fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

// ── State badge ────────────────────────────────────────────────────────────────
function StateBadge({ state, versionState }: { state: DefinitionState; versionState?: VersionState }) {
  if (state === 'Published' && versionState === 'Active') {
    return <span className="state-badge active">● Active</span>
  }
  if (state === 'Published' && versionState === 'Inactive') {
    return <span className="state-badge inactive">◎ Inactive</span>
  }
  if (state === 'Published') {
    return <span className="state-badge published">● Published</span>
  }
  if (state === 'Draft') {
    return <span className="state-badge draft">○ Draft</span>
  }
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

  /** Returns the single "representative" definition per family for collapsed view.
   *  Priority: Active > Draft (highest version) > Inactive (highest version) > Archived (highest version) */
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

  /** Total members in the family that contains this definition. */
  const familySize = (def: AssetDefinition): number => {
    const fid = def.baseDefinitionId ?? def.id
    return definitions.filter(d => (d.baseDefinitionId ?? d.id) === fid).length
  }

  /** How many Drafts are pending review in the family. */
  const familyPendingCount = (def: AssetDefinition): number => {
    const fid = def.baseDefinitionId ?? def.id
    return definitions.filter(d => (d.baseDefinitionId ?? d.id) === fid && d.state === 'Draft').length
  }

  // ── Search + state filter ────────────────────────────────────────────────────
  const matchesFilters = (d: AssetDefinition) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      d.manufacturer.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.source.toLowerCase().includes(q)
    const matchState =
      filterState === 'all' ||
      (filterState === 'draft'     && d.state === 'Draft') ||
      (filterState === 'active'    && d.state === 'Published' && d.versionState === 'Active') ||
      (filterState === 'inactive'  && d.state === 'Published' && d.versionState === 'Inactive') ||
      (filterState === 'published' && d.state === 'Published') ||
      (filterState === 'archived'  && d.state === 'Archived')
    return matchSearch && matchState
  }

  // ── Build display list ───────────────────────────────────────────────────────
  const displayList: AssetDefinition[] = (() => {
    if (showAllVersions) {
      // All versions grouped by family (desc version within group), filtered
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
      // Collapsed: one representative per family, then search filter
      return computeLatestPerFamily(definitions).filter(matchesFilters)
    }
    // Specific state filter: show ALL matching records so e.g. Archived v2 is never
    // hidden behind a different-state family representative
    return definitions.filter(matchesFilters)
  })()

  // ── Summary counts ───────────────────────────────────────────────────────────
  const totalFamilies = new Set(definitions.map(d => d.baseDefinitionId ?? d.id)).size
  const pendingReview = definitions.filter(d => d.state === 'Draft').length
  const activeCount   = definitions.filter(d => d.state === 'Published' && d.versionState === 'Active').length
  const inactiveCount = definitions.filter(d => d.state === 'Published' && d.versionState === 'Inactive').length
  const archivedCount = definitions.filter(d => d.state === 'Archived').length

  // Track rendered families (for group-header row in "show all" mode)
  const renderedFamilies = new Set<string>()

  return (
    <>
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

      {/* ── Pending review banner ───────────────────────────────────────────────── */}
      {pendingReview > 0 && (
        <div
          className="info-box warning"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => { setFilterState('draft'); setShowAllVersions(false) }}
        >
          <span>✎</span>
          <div>
            <strong>{pendingReview} definition{pendingReview !== 1 ? 's' : ''} pending review</strong>
            <span style={{ marginLeft: 10, fontSize: 12 }}>
              Click to filter — each must be reviewed by a catalog admin before becoming available in the customer catalog.
            </span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, whiteSpace: 'nowrap' }}>
            View all drafts →
          </span>
        </div>
      )}

      {/* ── Summary tiles ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          { key: 'all',      label: 'Definition Families', count: totalFamilies,  color: '#6b7280', icon: '⬡' },
          { key: 'draft',    label: 'Pending Review',       count: pendingReview,  color: '#d97706', icon: '✎' },
          { key: 'active',   label: 'Active',               count: activeCount,    color: '#16a34a', icon: '●' },
          { key: 'inactive', label: 'Inactive',             count: inactiveCount,  color: '#6b7280', icon: '◎' },
          { key: 'archived', label: 'Archived',             count: archivedCount,  color: '#9ca3af', icon: '◎' },
        ] as const).map(tile => (
          <div
            key={tile.key}
            className="card"
            onClick={() => { setFilterState(tile.key); setShowAllVersions(false) }}
            style={{
              padding: '12px 18px', margin: 0, flex: '1 1 120px', minWidth: 100, cursor: 'pointer',
              outline: filterState === tile.key ? `2px solid ${tile.color}` : undefined,
              outlineOffset: -2,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: tile.color }}>
              {tile.count}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)', marginTop: 2 }}>
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filters ────────────────────────────────────────────────────── */}
      <div className="search-bar" style={{ alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Search name, manufacturer, model, category, or source…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="all">All States</option>
          <option value="draft">Draft (Pending Review)</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="published">Published (all)</option>
          <option value="archived">Archived</option>
        </select>
        <button
          className={`btn btn-sm ${showAllVersions ? 'btn-primary' : 'btn-secondary'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setShowAllVersions(v => !v)}
        >
          {showAllVersions ? '⊟ Collapse to Latest' : '⊞ Show All Versions'}
        </button>
      </div>

      {/* ── Definitions table ───────────────────────────────────────────────────── */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Manufacturer / Model</th>
            <th>Source</th>
            <th>State</th>
            <th>Version</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayList.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--theme-color-soft-text)' }}>
                No definitions found
              </td>
            </tr>
          )}
          {displayList.map(def => {
            const fid = def.baseDefinitionId ?? def.id
            const isFirstInGroup = showAllVersions && !renderedFamilies.has(fid)
            if (showAllVersions) renderedFamilies.add(fid)
            const size    = familySize(def)
            const pending = familyPendingCount(def)
            const isCurrent = def.state === 'Published' && def.versionState === 'Active'
            const isDraft   = def.state === 'Draft'

            return (
              <Fragment key={def.id}>
                {/* Family group header row — only in "show all" mode */}
                {isFirstInGroup && (
                  <tr style={{ background: 'var(--theme-color-ghost-selected)' }}>
                    <td colSpan={8} style={{
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
                  style={showAllVersions
                    ? { background: isCurrent ? 'rgba(22,163,74,0.05)' : isDraft ? 'rgba(217,119,6,0.04)' : undefined }
                    : undefined}
                  onClick={() => navigate(`/internal/definitions/${def.id}`)}
                >
                  {/* Name + chips */}
                  <td className="link-cell" style={{ paddingLeft: showAllVersions ? 28 : undefined }}>
                    {def.name}
                    {/* In collapsed 'all' view: show family size + pending drafts chips */}
                    {!showAllVersions && filterState === 'all' && size > 1 && (
                      <span style={{
                        marginLeft: 8, fontSize: 11, background: 'var(--theme-color-ghost-selected)',
                        border: '1px solid var(--theme-color-soft-bdr)', borderRadius: 10,
                        padding: '1px 7px', color: 'var(--theme-color-soft-text)', fontWeight: 600,
                      }}>
                        {size} versions
                      </span>
                    )}
                    {!showAllVersions && filterState === 'all' && pending > 0 && (
                      <span style={{
                        marginLeft: 5, fontSize: 11, background: 'rgba(217,119,6,0.12)',
                        border: '1px solid rgba(217,119,6,0.35)', borderRadius: 10,
                        padding: '1px 7px', color: '#d97706', fontWeight: 700,
                      }}>
                        {pending} pending
                      </span>
                    )}
                  </td>

                  <td>{def.category}</td>
                  <td>{def.manufacturer} — {def.model}</td>
                  <td><SourceChip source={def.source} /></td>
                  <td><StateBadge state={def.state} versionState={def.versionState} /></td>
                  <td>v{def.version}</td>
                  <td>{def.createdDate}</td>

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
