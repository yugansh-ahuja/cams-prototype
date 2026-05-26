import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function WorkOrderList() {
  const { workOrders, assets } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const filtered = workOrders.filter(wo => {
    const asset = assets.find(a => a.id === wo.assetId)
    const assetName = asset?.name ?? ''
    const matchSearch =
      wo.id.toLowerCase().includes(search.toLowerCase()) ||
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      assetName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || wo.status.toLowerCase().replace(' ', '-') === filterStatus
    const matchPriority = filterPriority === 'all' || wo.priority.toLowerCase() === filterPriority
    return matchSearch && matchStatus && matchPriority
  })

  const counts = {
    total: workOrders.length,
    open: workOrders.filter(w => w.status === 'Open').length,
    inProgress: workOrders.filter(w => w.status === 'In Progress').length,
    high: workOrders.filter(w => w.priority === 'High').length,
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Orders</h1>
          <p className="page-subtitle">View and action your assigned work orders</p>
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', count: counts.total, color: '#6b7280' },
          { label: 'Open', count: counts.open, color: '#1a8fff' },
          { label: 'In Progress', count: counts.inProgress, color: '#f97316' },
          { label: 'High Priority', count: counts.high, color: '#dc2626' },
        ].map(tile => (
          <div key={tile.label} className="card" style={{ padding: '12px 20px', margin: 0, flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: tile.color }}>{tile.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--theme-color-soft-text)' }}>{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search work orders..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>WO Number</th>
            <th>Title</th>
            <th>Asset</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--theme-color-soft-text)' }}>
                No work orders found
              </td>
            </tr>
          )}
          {filtered.map(wo => {
            const asset = assets.find(a => a.id === wo.assetId)
            const isOverdue = wo.dueDate < new Date().toISOString().split('T')[0]
            return (
              <tr key={wo.id} className="clickable" onClick={() => navigate(`/technician/workorders/${wo.id}`)}>
                <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{wo.id}</td>
                <td className="link-cell">{wo.title}</td>
                <td>{asset?.name ?? wo.assetId}</td>
                <td>
                  <span className={`priority-badge ${wo.priority.toLowerCase()}`}>{wo.priority}</span>
                </td>
                <td>
                  <span className={`state-badge ${wo.status.toLowerCase().replace(' ', '-')}`}>
                    {wo.status === 'Open' && '○ '}
                    {wo.status === 'In Progress' && '◉ '}
                    {wo.status === 'Completed' && '● '}
                    {wo.status}
                  </span>
                </td>
                <td style={{ color: isOverdue ? '#dc2626' : undefined }}>
                  {wo.dueDate}{isOverdue && ' ⚠'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
