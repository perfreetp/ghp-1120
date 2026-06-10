export type EnergyType = 'electric' | 'water' | 'ac' | 'light'

export interface EnergyData {
  type: EnergyType
  value: number
  unit: string
  trend: number
  trendType: 'up' | 'down'
}

export interface ZoneEnergy {
  id: string
  name: string
  electric: number
  water: number
  ac: number
  light: number
  total: number
  percent: number
}

export interface PeakValleyData {
  period: string
  electric: number
  rate: number
  type: 'peak' | 'flat' | 'valley'
}

export interface CostEstimate {
  type: EnergyType
  current: number
  predicted: number
  lastMonth: number
  budget: number
  rate: number
}

export interface AbnormalRank {
  id: string
  name: string
  location: string
  type: EnergyType
  value: number
  threshold: number
  percent: number
  level: 'high' | 'medium' | 'low'
}

export interface RoomCurve {
  roomId: string
  roomName: string
  floor: number
  time: string[]
  electric: number[]
  water: number[]
  ac: number[]
  light: number[]
}

export interface DeviceStatus {
  id: string
  name: string
  type: EnergyType
  room: string
  floor: number
  status: 'on' | 'off'
  power: number
  runHours: number
  lastUpdate: string
}

export interface CompareData {
  period: string
  current: number
  lastYear: number
  lastMonth: number
  yoy: number
  mom: number
}

export interface ACStrategy {
  id: string
  name: string
  zone: string
  coolingTemp: number
  heatingTemp: number
  startTime: string
  endTime: string
  enable: boolean
}

export interface LightStrategy {
  id: string
  name: string
  zone: string
  startTime: string
  endTime: string
  brightness: number
  enable: boolean
}

export interface HolidayMode {
  id: string
  name: string
  dateRange: [string, string]
  acEnable: boolean
  lightEnable: boolean
  acTemp: number
}

export interface TempOverride {
  id: string
  zone: string
  targetTemp: number
  startTime: string
  endTime: string
  reason: string
  operator: string
}

export type AlarmType = 'exceed' | 'longRun' | 'offline' | 'missing'
export type AlarmStatus = 'pending' | 'processing' | 'resolved' | 'closed'

export interface Alarm {
  id: string
  type: AlarmType
  title: string
  level: 'critical' | 'major' | 'minor' | 'warning'
  location: string
  device?: string
  value?: number
  threshold?: number
  description: string
  time: string
  status: AlarmStatus
  handler?: string
  handleTime?: string
  handleNote?: string
}

export interface TenantShare {
  tenantId: string
  tenantName: string
  floor: number
  area: number
  electric: number
  water: number
  ac: number
  light: number
  shareElectric: number
  shareWater: number
  shareAc: number
  shareLight: number
  totalCost: number
}

export interface DeptReconciliation {
  deptId: string
  deptName: string
  manager: string
  budget: number
  actual: number
  variance: number
  varianceRate: number
  electric: number
  water: number
  ac: number
  light: number
}

export interface EnergySuggestion {
  id: string
  category: string
  title: string
  description: string
  savingPotential: number
  investment: number
  paybackPeriod: number
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'implemented'
}

export type WorkOrderStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'verified' | 'closed'
export type WorkOrderPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface WorkOrder {
  id: string
  title: string
  type: AlarmType
  alarmId?: string
  location: string
  description: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  assignee?: string
  assigneePhone?: string
  createTime: string
  assignTime?: string
  processTime?: string
  completeTime?: string
  verifyTime?: string
  closeTime?: string
  processNote?: string
  result?: string
  images?: string[]
  creator: string
}

export interface Floor {
  id: string
  name: string
  number: number
  area: number
  height: number
  roomCount: number
  description?: string
}

export interface Tenant {
  id: string
  name: string
  shortName: string
  floor: number
  room: string
  area: number
  contact: string
  phone: string
  email: string
  contractStart: string
  contractEnd: string
  status: 'active' | 'inactive' | 'pending'
}

export interface Meter {
  id: string
  code: string
  name: string
  type: EnergyType
  location: string
  floor: number
  room?: string
  manufacturer: string
  model: string
  installDate: string
  lastRead: string
  lastValue: number
  multiplier: number
  status: 'normal' | 'fault' | 'offline'
}

export interface Device {
  id: string
  code: string
  name: string
  type: EnergyType
  category: string
  location: string
  floor: number
  room?: string
  power: number
  manufacturer: string
  model: string
  installDate: string
  groupId?: string
  status: 'running' | 'stopped' | 'fault' | 'offline'
}

export interface DeviceGroup {
  id: string
  name: string
  type: EnergyType
  description?: string
  deviceCount: number
  deviceIds: string[]
}

export interface MaintenanceStaff {
  id: string
  name: string
  phone: string
  specialty: string[]
  status: 'available' | 'busy' | 'off'
  currentOrder?: string
}
