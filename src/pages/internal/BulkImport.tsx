import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { type AssetDefinition } from '../../data/mockData'

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUIRED_COLS = ['name', 'category', 'manufacturer', 'model', 'description', 'expectedLifespan', 'msrp'] as const

const CATEGORIES = ['Pumps', 'Security', 'Life Safety', 'Electrical', 'HVAC', 'Mechanical', 'Plumbing', 'IT Infrastructure', 'Other']

const TEMPLATE_CSV =
  'name,category,manufacturer,model,description,expectedLifespan,msrp,specification_label_1,specification_value_1,specification_label_2,specification_value_2\n' +
  'Example Pump,Pumps,Grundfos,CM-5,A sample booster pump,15,4200,Flow Rate,5 m³/h,Motor Rating,1 kW\n'

// ── Types ─────────────────────────────────────────────────────────────────────

type RowErrors = Partial<Record<string, string>>

interface ParsedRow {
  index: number
  raw: Record<string, string>
  errors: RowErrors
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim())
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

function validateRow(raw: Record<string, string>): RowErrors {
  const e: RowErrors = {}
  if (!raw.name?.trim()) e.name = 'Required'
  if (!raw.category?.trim()) e.category = 'Required'
  else if (!CATEGORIES.includes(raw.category.trim())) e.category = 'Unknown category'
  if (!raw.manufacturer?.trim()) e.manufacturer = 'Required'
  if (!raw.model?.trim()) e.model = 'Required'
  if (!raw.description?.trim()) e.description = 'Required'
  if (!raw.expectedLifespan?.trim() || isNaN(Number(raw.expectedLifespan))) e.expectedLifespan = 'Must be a number'
  if (!raw.msrp?.trim() || isNaN(Number(raw.msrp))) e.msrp = 'Must be a number'
  return e
}

function rowToDefinition(raw: Record<string, string>): AssetDefinition {
  const specs: { label: string; value: string }[] = []
  for (let i = 1; i <= 5; i++) {
    const l = raw[`specification_label_${i}`]?.trim()
    const v = raw[`specification_value_${i}`]?.trim()
    if (l && v) specs.push({ label: l, value: v })
  }
  return {
    id: `def-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: raw.name.trim(),
    assetClass: 'Equipment',
    category: raw.category.trim(),
    manufacturer: raw.manufacturer.trim(),
    model: raw.model.trim(),
    description: raw.description.trim(),
    expectedLifespan: Number(raw.expectedLifespan),
    msrp: Number(raw.msrp),
    state: 'Draft',
    version: 1,
    source: 'csv-import',
    createdDate: new Date().toISOString().split('T')[0],
    specifications: specs,
  }
}

// ── Step indicators ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Upload CSV', 'Preview & Validate', 'Confirm Import']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                background: done ? 'var(--theme-color-primary)' : active ? 'var(--theme-color-primary)' : 'var(--theme-color-border)',
                color: done || active ? '#fff' : 'var(--theme-color-soft-text)',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--theme-color-text)' : 'var(--theme-color-soft-text)' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'var(--theme-color-border)', margin: '0 12px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Upload ────────────────────────────────────────────────────────────

function StepUpload({ onParsed }: { onParsed: (rows: ParsedRow[], fileName: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Only .csv files are accepted.'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      const missing = REQUIRED_COLS.filter(c => !headers.includes(c))
      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(', ')}`)
        return
      }
      const parsed: ParsedRow[] = rows.map((raw, i) => ({ index: i + 1, raw, errors: validateRow(raw) }))
      onParsed(parsed, file.name)
    }
    reader.readAsText(file)
  }

  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault(); setDragging(false)
    const file = ev.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'definition_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h3 className="card-title">Upload CSV File</h3>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--theme-color-soft-text)', marginBottom: 8 }}>
          Your CSV must include the following required columns:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {REQUIRED_COLS.map(c => (
            <span key={c} style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--theme-color-bg-muted)', border: '1px solid var(--theme-color-border)', borderRadius: 4, padding: '2px 6px' }}>{c}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>
          Optional: <code>specification_label_N</code> / <code>specification_value_N</code> (N = 1–5)
        </p>
      </div>

      <div
        onDragOver={ev => { ev.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--theme-color-primary)' : 'var(--theme-color-border)'}`,
          borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(var(--theme-rgb-primary, 0,120,212), 0.04)' : 'transparent',
          transition: 'border-color 0.15s, background 0.15s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drag & drop your CSV here</div>
        <div style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>or click to browse files</div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={ev => { if (ev.target.files?.[0]) processFile(ev.target.files[0]) }} />
      </div>

      {error && (
        <div className="info-box error" style={{ marginBottom: 16 }}>
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
        ⬇ Download Template CSV
      </button>
    </div>
  )
}

// ── Step 2: Preview & Validate ────────────────────────────────────────────────

const DISPLAY_COLS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model', label: 'Model' },
  { key: 'expectedLifespan', label: 'Lifespan (yrs)' },
  { key: 'msrp', label: 'MSRP (USD)' },
]

function StepPreview({
  rows, fileName, onBack, onNext,
}: { rows: ParsedRow[]; fileName: string; onBack: () => void; onNext: (valid: ParsedRow[]) => void }) {
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  const errorRows = rows.filter(r => Object.keys(r.errors).length > 0)
  const validRows = rows.filter(r => Object.keys(r.errors).length === 0 && !skipped.has(r.index))

  const toggleSkip = (idx: number) => {
    setSkipped(s => {
      const next = new Set(s)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>Preview & Validate</h3>
        <span style={{ fontSize: 12, color: 'var(--theme-color-soft-text)' }}>{fileName} — {rows.length} rows</span>
      </div>

      {errorRows.length > 0 && (
        <div className="info-box warning" style={{ marginBottom: 16 }}>
          <span>⚠</span>
          <span><strong>{errorRows.length} row{errorRows.length > 1 ? 's' : ''}</strong> have validation errors. Fix the CSV or skip those rows to proceed.</span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              {DISPLAY_COLS.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Status</th>
              <th>Skip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const hasErr = Object.keys(row.errors).length > 0
              const isSkipped = skipped.has(row.index)
              return (
                <tr key={row.index} style={{ opacity: isSkipped ? 0.4 : 1 }}>
                  <td style={{ color: 'var(--theme-color-soft-text)', fontSize: 12 }}>{row.index}</td>
                  {DISPLAY_COLS.map(c => (
                    <td key={c.key}>
                      <span style={row.errors[c.key] ? { color: '#dc2626', fontWeight: 500 } : undefined}>
                        {row.raw[c.key] || <span style={{ color: 'var(--theme-color-soft-text)' }}>—</span>}
                      </span>
                      {row.errors[c.key] && (
                        <div style={{ fontSize: 10, color: '#dc2626' }}>{row.errors[c.key]}</div>
                      )}
                    </td>
                  ))}
                  <td>
                    {hasErr ? (
                      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Error</span>
                    ) : isSkipped ? (
                      <span style={{ fontSize: 11, color: 'var(--theme-color-soft-text)' }}>Skipped</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Valid</span>
                    )}
                  </td>
                  <td>
                    {!hasErr && (
                      <input
                        type="checkbox"
                        checked={isSkipped}
                        onChange={() => toggleSkip(row.index)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--theme-color-soft-text)' }}>
            {validRows.length} of {rows.length} rows will be imported
          </span>
          <button
            className="btn btn-primary"
            disabled={validRows.length === 0}
            onClick={() => onNext(validRows)}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Confirm ───────────────────────────────────────────────────────────

function StepConfirm({
  rows, onBack, onConfirm,
}: { rows: ParsedRow[]; onBack: () => void; onConfirm: () => void }) {
  return (
    <div className="card">
      <h3 className="card-title">Confirm Import</h3>

      <div className="info-box info" style={{ marginBottom: 20 }}>
        <span>ℹ</span>
        <span>
          <strong>{rows.length} definition{rows.length > 1 ? 's' : ''}</strong> will be imported as <strong>Draft</strong>.
          Use Publish from each definition detail to make them available to customers.
        </span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Lifespan (yrs)</th>
              <th>MSRP (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.index}>
                <td>{row.raw.name}</td>
                <td>{row.raw.category}</td>
                <td>{row.raw.manufacturer}</td>
                <td>{row.raw.model}</td>
                <td>{row.raw.expectedLifespan}</td>
                <td>${Number(row.raw.msrp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onConfirm}>
          Import {rows.length} Definition{rows.length > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BulkImport() {
  const { addDefinition, addToast } = useApp()
  const navigate = useNavigate()

  const [step, setStep]           = useState(1)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [validRows, setValidRows]   = useState<ParsedRow[]>([])
  const [fileName, setFileName]     = useState('')

  const handleParsed = (rows: ParsedRow[], name: string) => {
    setParsedRows(rows)
    setFileName(name)
    setStep(2)
  }

  const handleNext = (valid: ParsedRow[]) => {
    setValidRows(valid)
    setStep(3)
  }

  const handleConfirm = () => {
    validRows.forEach(row => addDefinition(rowToDefinition(row.raw)))
    addToast({
      type: 'success',
      title: 'Import Complete',
      message: `${validRows.length} definition${validRows.length > 1 ? 's' : ''} saved as Draft.`,
    })
    navigate('/internal/definitions')
  }

  return (
    <>
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/internal/definitions')}>Asset Definitions</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Bulk Import</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk Import Definitions</h1>
          <p className="page-subtitle">Import multiple asset definitions from a CSV file.</p>
        </div>
      </div>

      <StepBar step={step} />

      {step === 1 && <StepUpload onParsed={handleParsed} />}
      {step === 2 && (
        <StepPreview
          rows={parsedRows}
          fileName={fileName}
          onBack={() => setStep(1)}
          onNext={handleNext}
        />
      )}
      {step === 3 && (
        <StepConfirm
          rows={validRows}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
