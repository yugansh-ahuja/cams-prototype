export type DefinitionState = 'Draft' | 'Published' | 'Archived';
export type VersionState = 'Active' | 'Inactive';
export type DefinitionSource = 'manual' | 'csv-import' | 'api-ingestion' | 'manufacturer-portal';

export interface AssetDefinition {
  id: string;
  name: string;
  assetClass: string;
  category: string;
  manufacturer: string;
  model: string;
  description: string;
  expectedLifespan: number;
  msrp: number;
  state: DefinitionState;
  versionState?: VersionState;
  version: number;
  /** Shared identifier linking all versions of the same definition family. */
  baseDefinitionId?: string;
  /** The channel through which this definition entered the system. */
  source: DefinitionSource;
  createdDate: string;
  publishedDate?: string;
  archivedDate?: string;
  specifications: { label: string; value: string }[];
}

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  category: string;
  manufacturer: string;
  model: string;
  installDate: string;
  notes?: string;
  linkedDefinitionId?: string;
  recommendedDefinitionId?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  assetId: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
}

export const definitions: AssetDefinition[] = [
  // ── Booster Pump Package family (v1 csv-import → v2 api-ingestion → v3 manual Active → v4 manufacturer-portal Draft) ─
  {
    id: 'def-001',
    name: 'Booster Pump Package',
    assetClass: 'Equipment',
    category: 'Pumps',
    manufacturer: 'Grundfos',
    model: 'CM-10',
    description: 'High-efficiency centrifugal booster pump for pressure boosting in water supply systems.',
    expectedLifespan: 15,
    msrp: 4200,
    state: 'Published',
    versionState: 'Active',
    version: 3,
    baseDefinitionId: 'def-001',
    source: 'manual',
    createdDate: '2024-11-01',
    publishedDate: '2024-11-15',
    specifications: [
      { label: 'Flow Rate', value: '10 m³/h' },
      { label: 'Head', value: '45 m' },
      { label: 'Motor Rating', value: '2 kW, 400V IE3' },
      { label: 'Materials', value: 'Stainless Steel / Cast Iron' },
      { label: 'Connection Size', value: 'DN80' },
      { label: 'Seal Type', value: 'Mechanical seal' },
    ],
  },
  {
    id: 'def-001-v4-draft',
    name: 'Booster Pump Package',
    assetClass: 'Equipment',
    category: 'Pumps',
    manufacturer: 'Grundfos',
    model: 'CM-10',
    description: 'Next-generation high-efficiency centrifugal booster pump with smart monitoring and IE4 motor.',
    expectedLifespan: 15,
    msrp: 4500,
    state: 'Draft',
    version: 4,
    baseDefinitionId: 'def-001',
    source: 'manufacturer-portal',
    createdDate: '2025-05-01',
    specifications: [
      { label: 'Flow Rate', value: '12 m³/h' },
      { label: 'Head', value: '50 m' },
      { label: 'Motor Rating', value: '2.2 kW, 400V IE4' },
      { label: 'Materials', value: 'Stainless Steel' },
      { label: 'Connection Size', value: 'DN80' },
      { label: 'Seal Type', value: 'Mechanical seal' },
      { label: 'Smart Monitoring', value: 'Grundfos GO app compatible' },
    ],
  },
  {
    id: 'def-001-v2',
    name: 'Booster Pump Package',
    assetClass: 'Equipment',
    category: 'Pumps',
    manufacturer: 'Grundfos',
    model: 'CM-10',
    description: 'High-efficiency centrifugal booster pump for pressure boosting.',
    expectedLifespan: 15,
    msrp: 4000,
    state: 'Published',
    versionState: 'Inactive',
    version: 2,
    baseDefinitionId: 'def-001',
    source: 'api-ingestion',
    createdDate: '2024-10-01',
    publishedDate: '2024-10-20',
    specifications: [
      { label: 'Flow Rate', value: '10 m³/h' },
      { label: 'Head', value: '45 m' },
      { label: 'Motor Rating', value: '2 kW, 400V IE3' },
      { label: 'Connection Size', value: 'DN80' },
    ],
  },
  {
    id: 'def-001-v1',
    name: 'Booster Pump Package',
    assetClass: 'Equipment',
    category: 'Pumps',
    manufacturer: 'Grundfos',
    model: 'CM-10',
    description: 'Centrifugal booster pump for water supply pressure boosting.',
    expectedLifespan: 12,
    msrp: 3800,
    state: 'Published',
    versionState: 'Inactive',
    version: 1,
    baseDefinitionId: 'def-001',
    source: 'csv-import',
    createdDate: '2024-09-01',
    publishedDate: '2024-09-15',
    specifications: [
      { label: 'Flow Rate', value: '10 m³/h' },
      { label: 'Motor Rating', value: '2 kW, 400V' },
    ],
  },

  // ── Network PTZ Camera family (v1 csv-import → v2 api-ingestion Active) ──────
  {
    id: 'def-002',
    name: 'Network PTZ Camera',
    assetClass: 'Equipment',
    category: 'Security',
    manufacturer: 'Axis Communications',
    model: 'Q6115-E',
    description: 'Outdoor PTZ network camera with thermal imaging for perimeter surveillance.',
    expectedLifespan: 8,
    msrp: 3800,
    state: 'Published',
    versionState: 'Active',
    version: 2,
    baseDefinitionId: 'def-002',
    source: 'api-ingestion',
    createdDate: '2025-01-10',
    publishedDate: '2025-02-01',
    specifications: [
      { label: 'Resolution', value: '1080p HD' },
      { label: 'Zoom', value: '32x optical' },
      { label: 'IR Range', value: '200m' },
      { label: 'Protection', value: 'IP66/NEMA 4X' },
    ],
  },
  {
    id: 'def-002-v1',
    name: 'Network PTZ Camera',
    assetClass: 'Equipment',
    category: 'Security',
    manufacturer: 'Axis Communications',
    model: 'Q6115-E',
    description: 'Outdoor PTZ network camera for perimeter surveillance.',
    expectedLifespan: 8,
    msrp: 3500,
    state: 'Published',
    versionState: 'Inactive',
    version: 1,
    baseDefinitionId: 'def-002',
    source: 'csv-import',
    createdDate: '2024-12-01',
    publishedDate: '2025-01-01',
    specifications: [
      { label: 'Resolution', value: '720p HD' },
      { label: 'Zoom', value: '20x optical' },
      { label: 'Protection', value: 'IP66' },
    ],
  },

  // ── Fire Alarm Control Panel (manufacturer-portal, v1 Active, single version) ─
  {
    id: 'def-003',
    name: 'Fire Alarm Control Panel',
    assetClass: 'Equipment',
    category: 'Life Safety',
    manufacturer: 'Notifier',
    model: 'NFS2-3030',
    description: 'Addressable fire alarm control panel supporting up to 3,030 points.',
    expectedLifespan: 20,
    msrp: 12000,
    state: 'Published',
    versionState: 'Active',
    version: 1,
    baseDefinitionId: 'def-003',
    source: 'manufacturer-portal',
    createdDate: '2024-08-15',
    publishedDate: '2024-09-01',
    specifications: [
      { label: 'Points', value: '3,030 addressable' },
      { label: 'Loops', value: '30 SLC loops' },
      { label: 'Voltage', value: '120/240 VAC' },
      { label: 'Standards', value: 'UL 864, ULC-S527' },
    ],
  },

  // ── Power Monitoring Unit (csv-import, Draft v1) ───────────────────────────
  {
    id: 'def-004',
    name: 'Power Monitoring Unit',
    assetClass: 'Equipment',
    category: 'Electrical',
    manufacturer: 'Schneider Electric',
    model: 'PowerLogic PM8000',
    description: 'Advanced power and energy meter for revenue-grade metering and power quality analysis.',
    expectedLifespan: 12,
    msrp: 2900,
    state: 'Draft',
    version: 1,
    baseDefinitionId: 'def-004',
    source: 'csv-import',
    createdDate: '2025-03-20',
    specifications: [
      { label: 'Accuracy', value: 'Class 0.1S' },
      { label: 'Display', value: '3.5" touchscreen' },
      { label: 'Communications', value: 'Modbus, BACnet, Ethernet' },
    ],
  },

  // ── Rooftop HVAC Unit (api-ingestion, Draft v1) ────────────────────────────
  {
    id: 'def-005',
    name: 'Rooftop HVAC Unit',
    assetClass: 'Equipment',
    category: 'HVAC',
    manufacturer: 'Carrier',
    model: 'WeatherExpert 48WE',
    description: 'Single-packaged rooftop unit for commercial applications with advanced controls.',
    expectedLifespan: 18,
    msrp: 28000,
    state: 'Draft',
    version: 1,
    baseDefinitionId: 'def-005',
    source: 'api-ingestion',
    createdDate: '2025-04-05',
    specifications: [
      { label: 'Cooling Capacity', value: '20 Ton' },
      { label: 'SEER', value: '16' },
      { label: 'Refrigerant', value: 'R-410A' },
      { label: 'Electrical', value: '460V/3Ph/60Hz' },
    ],
  },

  // ── Generator 500kVA family (v1 manual Inactive → v2 manual Archived) ────
  {
    id: 'def-006',
    name: 'Generator 500kVA',
    assetClass: 'Equipment',
    category: 'Electrical',
    manufacturer: 'Cummins',
    model: 'C500D5',
    description: 'Diesel prime power generator for continuous duty applications with UL certified alternator.',
    expectedLifespan: 25,
    msrp: 85000,
    state: 'Archived',
    version: 2,
    baseDefinitionId: 'def-006',
    source: 'manual',
    createdDate: '2024-06-01',
    publishedDate: '2024-06-20',
    archivedDate: '2025-01-15',
    specifications: [
      { label: 'Prime Power', value: '500 kVA' },
      { label: 'Standby Power', value: '550 kVA' },
      { label: 'Fuel Type', value: 'Diesel' },
      { label: 'Certification', value: 'UL Listed' },
    ],
  },
  {
    id: 'def-006-v1',
    name: 'Generator 500kVA',
    assetClass: 'Equipment',
    category: 'Electrical',
    manufacturer: 'Cummins',
    model: 'C500D5',
    description: 'Diesel prime power generator for continuous duty applications.',
    expectedLifespan: 25,
    msrp: 82000,
    state: 'Published',
    versionState: 'Inactive',
    version: 1,
    baseDefinitionId: 'def-006',
    source: 'manual',
    createdDate: '2024-05-01',
    publishedDate: '2024-05-25',
    specifications: [
      { label: 'Prime Power', value: '500 kVA' },
      { label: 'Fuel Type', value: 'Diesel' },
    ],
  },
];

export const assets: Asset[] = [
  {
    id: 'ast-001',
    name: 'Main Booster Pump - Building A',
    serialNumber: 'PUM-00001',
    location: 'Building A - Basement Plant Room',
    category: 'Pumps',
    manufacturer: 'Grundfos',
    model: 'CM-10',
    installDate: '2021-03-15',
    linkedDefinitionId: 'def-001',
  },
  {
    id: 'ast-002',
    name: 'South Perimeter Camera',
    serialNumber: 'CAM-00042',
    location: 'External - South Fence Line',
    category: 'Security',
    manufacturer: 'Axis Communications',
    model: 'Q6115-E',
    installDate: '2022-07-10',
    recommendedDefinitionId: 'def-002',
  },
  {
    id: 'ast-003',
    name: 'Main Fire Panel - Block C',
    serialNumber: 'FP-00003',
    location: 'Block C - Security Room',
    category: 'Life Safety',
    manufacturer: 'Notifier',
    model: 'NFS2-3030',
    installDate: '2019-11-01',
    linkedDefinitionId: 'def-003',
  },
  {
    id: 'ast-004',
    name: 'Main Power Meter - Campus',
    serialNumber: 'PM-00001',
    location: 'Main Electrical Room',
    category: 'Electrical',
    manufacturer: 'Schneider Electric',
    model: 'PM8000',
    installDate: '2023-01-20',
  },
  {
    id: 'ast-005',
    name: 'Roof Unit - Block B',
    serialNumber: 'HVAC-00008',
    location: 'Rooftop - Block B',
    category: 'HVAC',
    manufacturer: 'Carrier',
    model: '48WE-020',
    installDate: '2020-05-12',
    recommendedDefinitionId: 'def-005',
  },
  {
    id: 'ast-006',
    name: 'Emergency Generator',
    serialNumber: 'GEN-00001',
    location: 'External Generator Pad',
    category: 'Electrical',
    manufacturer: 'Cummins',
    model: 'C500D5',
    installDate: '2018-09-30',
    linkedDefinitionId: 'def-006',
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: 'WO-10042',
    title: 'Annual pump inspection and maintenance',
    assetId: 'ast-001',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Jason Statham',
    dueDate: '2025-06-15',
  },
  {
    id: 'WO-10051',
    title: 'Camera lens cleaning and alignment check',
    assetId: 'ast-002',
    status: 'Open',
    priority: 'Low',
    assignee: 'Jason Statham',
    dueDate: '2025-06-20',
  },
  {
    id: 'WO-10065',
    title: 'Generator load bank test',
    assetId: 'ast-006',
    status: 'Open',
    priority: 'High',
    assignee: 'Jason Statham',
    dueDate: '2025-06-10',
  },
];
