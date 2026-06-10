import type {
  EnergyData, ZoneEnergy, PeakValleyData, CostEstimate, AbnormalRank,
  RoomCurve, DeviceStatus, CompareData, ACStrategy, LightStrategy,
  HolidayMode, TempOverride, Alarm, TenantShare, DeptReconciliation,
  EnergySuggestion, WorkOrder, Floor, Tenant, Meter, Device, DeviceGroup,
  MaintenanceStaff, EnergyType
} from '@/types'

function random(min: number, max: number, decimals = 0): number {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function genHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
}

function genSeries(base: number, variance: number): number[] {
  return Array.from({ length: 24 }, () => random(base * 0.6, base * 1.4, 1) + Math.random() * variance)
}

const zoneNames = ['A区办公', 'B区商业', 'C区公寓', 'D区停车场', 'E区大堂', 'F区公共']
const floorNames = ['1F 大堂', '2F-5F 办公', '6F-10F 办公', '11F-15F 办公', '16F-20F 办公', 'B1 停车场', 'B2 设备层']
const roomNames = ['会议室A', '会议室B', '开放办公区1', '开放办公区2', '经理室', '茶水间', '档案室', '机房', '前台区', '走廊']
const deviceNames_AC = ['中央空调主机1', '中央空调主机2', '风机盘管-101', '风机盘管-102', '新风系统A', '新风系统B']
const deviceNames_Light = ['办公区照明A', '办公区照明B', '走廊照明', '大堂照明', '停车场照明', '应急照明']
const deviceNames_Electric = ['配电柜A', '配电柜B', 'UPS系统', '电梯1', '电梯2', '水泵']
const deviceNames_Water = ['冷水表组1', '冷水表组2', '热水表组1', '中水系统', '消防水系统']
const tenantNames = ['科技创新公司', '金融投资集团', '咨询服务公司', '软件开发公司', '文化传媒公司', '律师事务所', '会计师事务所', '医药研发公司', '教育培训公司', '酒店管理公司']
const alarmTitles = {
  exceed: ['用电负荷超额', '用水量超标', '空调能耗超额', '照明能耗超标'],
  longRun: ['设备长时间开启', '空调连续运行超时', '照明未关闭', '水泵持续运行'],
  offline: ['传感器离线', '电表通讯中断', '水表数据丢失', '温控器失联'],
  missing: ['抄表数据缺失', '用电记录不完整', '用水记录中断', '空调运行数据缺失']
}
const staffNames = ['张工程师', '李维修员', '王技术员', '赵电工', '陈水暖工', '刘空调工']

export const mockEnergyOverview: EnergyData[] = [
  { type: 'electric', value: 128650, unit: 'kWh', trend: 8.5, trendType: 'up' },
  { type: 'water', value: 3280, unit: '吨', trend: -3.2, trendType: 'down' },
  { type: 'ac', value: 56420, unit: 'kWh', trend: 12.8, trendType: 'up' },
  { type: 'light', value: 18950, unit: 'kWh', trend: -5.1, trendType: 'down' }
]

export const mockZoneEnergy: ZoneEnergy[] = zoneNames.map((name, i) => {
  const electric = random(10000, 30000, 0)
  const water = random(200, 800, 0)
  const ac = random(5000, 15000, 0)
  const light = random(2000, 6000, 0)
  const total = electric + water + ac + light
  return {
    id: `Z${i + 1}`,
    name,
    electric,
    water,
    ac,
    light,
    total,
    percent: 0
  }
}).map(z => ({ ...z, percent: Number(((z.total / mockZoneEnergy.reduce((s, x) => s + x.total, 0)) * 100).toFixed(1)) }))

export const mockPeakValley: PeakValleyData[] = [
  { period: '尖峰 10:00-12:00', electric: 18500, rate: 1.35, type: 'peak' },
  { period: '高峰 14:00-19:00', electric: 32600, rate: 1.08, type: 'peak' },
  { period: '平段 08:00-10:00', electric: 12400, rate: 0.72, type: 'flat' },
  { period: '平段 12:00-14:00', electric: 15800, rate: 0.72, type: 'flat' },
  { period: '平段 19:00-22:00', electric: 18200, rate: 0.72, type: 'flat' },
  { period: '低谷 22:00-08:00', electric: 31150, rate: 0.36, type: 'valley' }
]

export const mockCostEstimate: CostEstimate[] = [
  { type: 'electric', current: 92780, predicted: 135600, lastMonth: 118500, budget: 150000, rate: 0.72 },
  { type: 'water', current: 3280, predicted: 4850, lastMonth: 4200, budget: 6000, rate: 5.6 },
  { type: 'ac', current: 40560, predicted: 62800, lastMonth: 48600, budget: 70000, rate: 0.85 },
  { type: 'light', current: 13650, predicted: 21200, lastMonth: 19800, budget: 25000, rate: 0.72 }
]

export const mockAbnormalRank: AbnormalRank[] = [
  { id: 'AB001', name: '6F 空调系统', location: '6F-10F 办公区', type: 'ac', value: 2850, threshold: 2000, percent: 142.5, level: 'high' },
  { id: 'AB002', name: '3F 配电柜', location: '2F-5F 办公区', type: 'electric', value: 1860, threshold: 1500, percent: 124.0, level: 'high' },
  { id: 'AB003', name: 'B1 停车场照明', location: 'B1 停车场', type: 'light', value: 890, threshold: 600, percent: 148.3, level: 'medium' },
  { id: 'AB004', name: '12F 卫生间', location: '11F-15F 办公区', type: 'water', value: 128, threshold: 80, percent: 160.0, level: 'medium' },
  { id: 'AB005', name: '大堂中央空调', location: '1F 大堂', type: 'ac', value: 1650, threshold: 1200, percent: 137.5, level: 'medium' },
  { id: 'AB006', name: '8F 开放办公区', location: '6F-10F 办公区', type: 'electric', value: 1320, threshold: 1100, percent: 120.0, level: 'low' },
  { id: 'AB007', name: '18F 走廊照明', location: '16F-20F 办公区', type: 'light', value: 560, threshold: 450, percent: 124.4, level: 'low' },
  { id: 'AB008', name: '设备层水泵', location: 'B2 设备层', type: 'water', value: 245, threshold: 200, percent: 122.5, level: 'low' }
]

export const mockRoomCurves: RoomCurve[] = roomNames.slice(0, 5).map((name, i) => ({
  roomId: `R${100 + i}`,
  roomName: name,
  floor: 3,
  time: genHours(),
  electric: genSeries(50 + i * 10, 20),
  water: genSeries(5 + i, 3),
  ac: genSeries(30 + i * 5, 15),
  light: genSeries(20 + i * 3, 10)
}))

export const mockDeviceStatus: DeviceStatus[] = [
  ...deviceNames_AC.slice(0, 4).map((n, i) => ({
    id: `AC${i + 1}`, name: n, type: 'ac' as EnergyType, room: pick(roomNames), floor: random(1, 20),
    status: pick<DeviceStatus['status']>(['on', 'off']), power: random(5, 50, 1), runHours: random(100, 5000),
    lastUpdate: new Date(Date.now() - random(0, 3600000)).toISOString()
  })),
  ...deviceNames_Light.slice(0, 4).map((n, i) => ({
    id: `LT${i + 1}`, name: n, type: 'light' as EnergyType, room: pick(roomNames), floor: random(1, 20),
    status: pick<DeviceStatus['status']>(['on', 'off']), power: random(1, 20, 1), runHours: random(500, 8000),
    lastUpdate: new Date(Date.now() - random(0, 3600000)).toISOString()
  })),
  ...deviceNames_Electric.slice(0, 4).map((n, i) => ({
    id: `EL${i + 1}`, name: n, type: 'electric' as EnergyType, room: '机房/公共', floor: random(1, 20),
    status: 'on' as const, power: random(50, 200, 1), runHours: random(5000, 10000),
    lastUpdate: new Date(Date.now() - random(0, 3600000)).toISOString()
  })),
  ...deviceNames_Water.slice(0, 3).map((n, i) => ({
    id: `WT${i + 1}`, name: n, type: 'water' as EnergyType, room: '管道井', floor: random(1, 20),
    status: 'on' as const, power: random(2, 15, 1), runHours: random(2000, 8000),
    lastUpdate: new Date(Date.now() - random(0, 3600000)).toISOString()
  }))
]

export const mockCompareData: CompareData[] = [
  { period: '本周', current: 45280, lastYear: 42150, lastMonth: 48620, yoy: 7.4, mom: -6.9 },
  { period: '本月', current: 128650, lastYear: 115200, lastMonth: 138500, yoy: 11.7, mom: -7.1 },
  { period: '本季度', current: 385420, lastYear: 342180, lastMonth: 402850, yoy: 12.6, mom: -4.3 },
  { period: '本年', current: 1428650, lastYear: 1285400, lastMonth: 1358200, yoy: 11.1, mom: 5.2 }
]

export const mockACStrategies: ACStrategy[] = [
  { id: 'ACS001', name: '办公区制冷策略', zone: '2F-20F 办公区', coolingTemp: 26, heatingTemp: 20, startTime: '08:00', endTime: '20:00', enable: true },
  { id: 'ACS002', name: '大堂空调策略', zone: '1F 大堂', coolingTemp: 27, heatingTemp: 22, startTime: '07:00', endTime: '22:00', enable: true },
  { id: 'ACS003', name: '会议室策略', zone: '各层会议室', coolingTemp: 25, heatingTemp: 21, startTime: '08:30', endTime: '21:00', enable: true },
  { id: 'ACS004', name: '机房恒温策略', zone: 'B2 设备层机房', coolingTemp: 24, heatingTemp: 22, startTime: '00:00', endTime: '24:00', enable: true },
  { id: 'ACS005', name: '停车场策略', zone: 'B1 停车场', coolingTemp: 28, heatingTemp: 18, startTime: '06:00', endTime: '23:00', enable: false }
]

export const mockLightStrategies: LightStrategy[] = [
  { id: 'LIS001', name: '办公区照明', zone: '2F-20F 办公区', startTime: '07:30', endTime: '21:00', brightness: 80, enable: true },
  { id: 'LIS002', name: '大堂照明', zone: '1F 大堂', startTime: '06:00', endTime: '23:00', brightness: 90, enable: true },
  { id: 'LIS003', name: '走廊照明', zone: '公共走廊', startTime: '06:00', endTime: '24:00', brightness: 60, enable: true },
  { id: 'LIS004', name: '停车场照明', zone: 'B1 停车场', startTime: '00:00', endTime: '24:00', brightness: 70, enable: true },
  { id: 'LIS005', name: '景观照明', zone: '室外景观', startTime: '18:00', endTime: '23:00', brightness: 100, enable: false }
]

export const mockHolidayModes: HolidayMode[] = [
  { id: 'HM001', name: '周末模式', dateRange: ['2026-06-13', '2026-06-14'], acEnable: false, lightEnable: true, acTemp: 28 },
  { id: 'HM002', name: '端午节假期', dateRange: ['2026-06-20', '2026-06-22'], acEnable: false, lightEnable: true, acTemp: 28 },
  { id: 'HM003', name: '国庆节假期', dateRange: ['2026-10-01', '2026-10-07'], acEnable: false, lightEnable: true, acTemp: 28 }
]

export const mockTempOverrides: TempOverride[] = [
  { id: 'TO001', zone: '8F 会议室A', targetTemp: 24, startTime: '2026-06-10 14:00', endTime: '2026-06-10 18:00', reason: '重要客户会议', operator: '王经理' },
  { id: 'TO002', zone: '15F 开放办公区', targetTemp: 25, startTime: '2026-06-10 09:00', endTime: '2026-06-10 12:00', reason: '员工反映温度过高', operator: '李主管' }
]

function genAlarms(count: number): Alarm[] {
  const levels: Alarm['level'][] = ['critical', 'major', 'minor', 'warning']
  const statuses: Alarm['status'][] = ['pending', 'processing', 'resolved', 'closed']
  const types: Alarm['type'][] = ['exceed', 'longRun', 'offline', 'missing']
  return Array.from({ length: count }, (_, i) => {
    const type = pick(types)
    return {
      id: `AL${String(2000 + i).padStart(5, '0')}`,
      type,
      title: pick(alarmTitles[type]),
      level: pick(levels),
      location: pick(floorNames),
      device: pick([...deviceNames_AC, ...deviceNames_Light, ...deviceNames_Electric]),
      value: random(50, 500),
      threshold: random(30, 200),
      description: '检测到异常情况，请及时处理。详细数据已记录在系统中。',
      time: new Date(Date.now() - random(0, 72 * 3600 * 1000)).toISOString(),
      status: pick(statuses),
      handler: Math.random() > 0.3 ? pick(staffNames) : undefined,
      handleTime: Math.random() > 0.5 ? new Date(Date.now() - random(0, 24 * 3600 * 1000)).toISOString() : undefined,
      handleNote: Math.random() > 0.6 ? '已检查设备，调整运行参数后恢复正常。' : undefined
    }
  })
}

export const mockAlarms: Alarm[] = genAlarms(30)

export const mockTenantShares: TenantShare[] = tenantNames.map((name, i) => {
  const area = random(100, 800)
  const electric = random(2000, 15000, 0)
  const water = random(50, 400, 0)
  const ac = random(1000, 8000, 0)
  const light = random(500, 3000, 0)
  return {
    tenantId: `T${String(i + 1).padStart(4, '0')}`,
    tenantName: name,
    floor: random(2, 20),
    area,
    electric, water, ac, light,
    shareElectric: Number((electric * 0.12 * 0.72).toFixed(2)),
    shareWater: Number((water * 5.6).toFixed(2)),
    shareAc: Number((ac * 0.85).toFixed(2)),
    shareLight: Number((light * 0.72).toFixed(2)),
    totalCost: 0
  }
}).map(t => ({ ...t, totalCost: Number((t.shareElectric + t.shareWater + t.shareAc + t.shareLight).toFixed(2)) }))

export const mockDeptReconciliation: DeptReconciliation[] = [
  { deptId: 'D001', deptName: '行政部', manager: '张经理', budget: 30000, actual: 28560, variance: 1440, varianceRate: 4.8, electric: 12000, water: 850, ac: 10200, light: 5510 },
  { deptId: 'D002', deptName: '技术部', manager: '李总监', budget: 80000, actual: 85420, variance: -5420, varianceRate: -6.8, electric: 42000, water: 1200, ac: 28500, light: 13720 },
  { deptId: 'D003', deptName: '财务部', manager: '王主管', budget: 20000, actual: 18950, variance: 1050, varianceRate: 5.3, electric: 8500, water: 620, ac: 6800, light: 3030 },
  { deptId: 'D004', deptName: '市场部', manager: '赵经理', budget: 25000, actual: 26800, variance: -1800, varianceRate: -7.2, electric: 11500, water: 780, ac: 9500, light: 5020 },
  { deptId: 'D005', deptName: '人力资源部', manager: '陈经理', budget: 15000, actual: 14280, variance: 720, varianceRate: 4.8, electric: 6500, water: 480, ac: 5000, light: 2300 },
  { deptId: 'D006', deptName: '运营部', manager: '刘主管', budget: 35000, actual: 36200, variance: -1200, varianceRate: -3.4, electric: 15800, water: 950, ac: 13000, light: 6450 }
]

export const mockEnergySuggestions: EnergySuggestion[] = [
  { id: 'S001', category: '照明系统', title: 'LED灯具替换', description: '将传统荧光灯替换为LED灯具，预计节能40%以上。', savingPotential: 85000, investment: 120000, paybackPeriod: 1.4, priority: 'high', status: 'approved' },
  { id: 'S002', category: '空调系统', title: '变频改造', description: '对中央空调主机进行变频改造，根据负荷自动调节输出。', savingPotential: 120000, investment: 280000, paybackPeriod: 2.3, priority: 'high', status: 'pending' },
  { id: 'S003', category: '空调系统', title: '加装新风热回收', description: '安装新风热回收装置，降低新风处理能耗。', savingPotential: 65000, investment: 180000, paybackPeriod: 2.8, priority: 'medium', status: 'pending' },
  { id: 'S004', category: '用水管理', title: '节水器具更换', description: '更换节水型水龙头和马桶配件。', savingPotential: 18000, investment: 45000, paybackPeriod: 2.5, priority: 'medium', status: 'implemented' },
  { id: 'S005', category: '智能控制', title: '人体感应照明', description: '在走廊、卫生间等区域安装人体感应器。', savingPotential: 32000, investment: 68000, paybackPeriod: 2.1, priority: 'medium', status: 'approved' },
  { id: 'S006', category: '能源管理', title: '分项计量完善', description: '完善各楼层、各租户分项计量系统，精细化管理。', savingPotential: 45000, investment: 150000, paybackPeriod: 3.3, priority: 'low', status: 'pending' }
]

function genWorkOrders(count: number): WorkOrder[] {
  const priorities: WorkOrder['priority'][] = ['urgent', 'high', 'medium', 'low']
  const statuses: WorkOrder['status'][] = ['pending', 'assigned', 'processing', 'completed', 'verified', 'closed']
  const types: Alarm['type'][] = ['exceed', 'longRun', 'offline', 'missing']
  const results = ['已修复设备故障', '已更换损坏部件', '已校准传感器', '已调整运行参数', '已恢复通讯连接']
  return Array.from({ length: count }, (_, i) => {
    const status = pick(statuses)
    const type = pick(types)
    const assignee = status !== 'pending' ? pick(staffNames) : undefined
    return {
      id: `WO${String(5000 + i).padStart(6, '0')}`,
      title: pick(alarmTitles[type]) + '处理',
      type,
      alarmId: `AL${String(2000 + i).padStart(5, '0')}`,
      location: pick(floorNames),
      description: '设备异常需要检修，请尽快处理。',
      priority: pick(priorities),
      status,
      assignee,
      assigneePhone: `138${String(random(10000000, 99999999))}`,
      createTime: new Date(Date.now() - random(1, 10) * 24 * 3600 * 1000).toISOString(),
      assignTime: status !== 'pending' ? new Date(Date.now() - random(1, 8) * 24 * 3600 * 1000).toISOString() : undefined,
      processTime: ['processing', 'completed', 'verified', 'closed'].includes(status) ? new Date(Date.now() - random(1, 6) * 24 * 3600 * 1000).toISOString() : undefined,
      completeTime: ['completed', 'verified', 'closed'].includes(status) ? new Date(Date.now() - random(1, 4) * 24 * 3600 * 1000).toISOString() : undefined,
      verifyTime: ['verified', 'closed'].includes(status) ? new Date(Date.now() - random(1, 2) * 24 * 3600 * 1000).toISOString() : undefined,
      closeTime: status === 'closed' ? new Date(Date.now() - random(0, 1) * 24 * 3600 * 1000).toISOString() : undefined,
      processNote: ['processing', 'completed', 'verified', 'closed'].includes(status) ? '正在排查故障原因，预计2小时内完成。' : undefined,
      result: ['completed', 'verified', 'closed'].includes(status) ? pick(results) : undefined,
      creator: '系统自动'
    }
  })
}

export const mockWorkOrders: WorkOrder[] = genWorkOrders(25)

export const mockFloors: Floor[] = [
  { id: 'F01', name: '1F 大堂', number: 1, area: 2800, height: 5.5, roomCount: 8, description: '包含大堂、前台、展示区' },
  { id: 'F02', name: '2F-5F 办公区', number: 2, area: 3200, height: 3.6, roomCount: 24 },
  { id: 'F06', name: '6F-10F 办公区', number: 6, area: 3200, height: 3.6, roomCount: 24 },
  { id: 'F11', name: '11F-15F 办公区', number: 11, area: 3200, height: 3.6, roomCount: 24 },
  { id: 'F16', name: '16F-20F 办公区', number: 16, area: 3200, height: 3.6, roomCount: 24 },
  { id: 'FB1', name: 'B1 停车场', number: -1, area: 4500, height: 3.2, roomCount: 1, description: '地下停车场，200个车位' },
  { id: 'FB2', name: 'B2 设备层', number: -2, area: 2000, height: 4.0, roomCount: 6, description: '机房、配电室、水泵房' }
]

export const mockTenants: Tenant[] = tenantNames.map((name, i) => ({
  id: `TE${String(i + 1).padStart(4, '0')}`,
  name,
  shortName: name.slice(0, 4),
  floor: 2 + i * 2,
  room: `${2 + i * 2}F-${String(100 + i * 3).padStart(3, '0')}`,
  area: random(200, 1000),
  contact: pick(['张总', '李总', '王经理', '赵经理', '陈主管']),
  phone: `139${String(random(10000000, 99999999))}`,
  email: `${name.slice(0, 4).toLowerCase()}@company.com`,
  contractStart: '2025-01-01',
  contractEnd: '2027-12-31',
  status: pick<Tenant['status']>(['active', 'active', 'active', 'pending'])
}))

function genMeters(count: number): Meter[] {
  const types: EnergyType[] = ['electric', 'water', 'ac', 'light']
  return Array.from({ length: count }, (_, i) => {
    const type = pick(types)
    return {
      id: `M${String(i + 1).padStart(5, '0')}`,
      code: `M${type.toUpperCase()}${String(i + 1).padStart(4, '0')}`,
      name: `${type === 'electric' ? '电表' : type === 'water' ? '水表' : type === 'ac' ? '空调表' : '照明表'}-${String(i + 1).padStart(3, '0')}`,
      type,
      location: pick(floorNames),
      floor: random(-2, 20),
      room: pick(roomNames),
      manufacturer: pick(['华立仪表', '三星电气', '威胜集团', '正泰电器']),
      model: pick(['DDZY866', 'DTZY866', 'LXSY-20', 'DN20']),
      installDate: `202${random(2, 5)}-${String(random(1, 12)).padStart(2, '0')}-${String(random(1, 28)).padStart(2, '0')}`,
      lastRead: new Date(Date.now() - random(0, 24) * 3600 * 1000).toISOString(),
      lastValue: random(1000, 100000, 2),
      multiplier: pick([1, 10, 20, 50, 100]),
      status: pick<Meter['status']>(['normal', 'normal', 'normal', 'fault', 'offline'])
    }
  })
}

export const mockMeters: Meter[] = genMeters(60)

function genDevices(count: number): Device[] {
  const types: EnergyType[] = ['electric', 'water', 'ac', 'light']
  const allNames = { electric: deviceNames_Electric, water: deviceNames_Water, ac: deviceNames_AC, light: deviceNames_Light }
  return Array.from({ length: count }, (_, i) => {
    const type = pick(types)
    return {
      id: `DEV${String(i + 1).padStart(5, '0')}`,
      code: `DV${type.toUpperCase()}${String(i + 1).padStart(4, '0')}`,
      name: pick(allNames[type]),
      type,
      category: pick(['主机设备', '末端设备', '输送设备', '控制设备']),
      location: pick(floorNames),
      floor: random(-2, 20),
      room: pick(roomNames),
      power: random(5, 300, 1),
      manufacturer: pick(['格力电器', '美的集团', '海尔智家', '西门子', '施耐德']),
      model: pick(['GMV5', 'MDV-450', 'KFR-120', '3WL', 'NSX']),
      installDate: `202${random(1, 5)}-${String(random(1, 12)).padStart(2, '0')}-${String(random(1, 28)).padStart(2, '0')}`,
      groupId: `GRP${String(random(1, 8)).padStart(3, '0')}`,
      status: pick<Device['status']>(['running', 'running', 'running', 'stopped', 'fault', 'offline'])
    }
  })
}

export const mockDevices: Device[] = genDevices(80)

export const mockDeviceGroups: DeviceGroup[] = [
  { id: 'GRP001', name: '中央空调主机组', type: 'ac', description: '包含2台主机制冷系统', deviceCount: 6, deviceIds: [] },
  { id: 'GRP002', name: '办公区风机盘管', type: 'ac', description: '各楼层风机盘管设备', deviceCount: 24, deviceIds: [] },
  { id: 'GRP003', name: '新风系统组', type: 'ac', description: '全楼新风处理设备', deviceCount: 8, deviceIds: [] },
  { id: 'GRP004', name: '公共区域照明', type: 'light', description: '大堂、走廊、停车场照明', deviceCount: 32, deviceIds: [] },
  { id: 'GRP005', name: '办公区照明', type: 'light', description: '2-20F办公区域照明', deviceCount: 48, deviceIds: [] },
  { id: 'GRP006', name: '主配电柜', type: 'electric', description: 'B2层主配电设备', deviceCount: 4, deviceIds: [] },
  { id: 'GRP007', name: '供水系统', type: 'water', description: '生活供水及消防系统', deviceCount: 8, deviceIds: [] },
  { id: 'GRP008', name: '电梯系统', type: 'electric', description: '全部客梯货梯设备', deviceCount: 6, deviceIds: [] }
]

export const mockStaffs: MaintenanceStaff[] = staffNames.map((name, i) => ({
  id: `ST${String(i + 1).padStart(3, '0')}`,
  name,
  phone: `138${String(random(10000000, 99999999))}`,
  specialty: [pick(['电气维修', '空调维修', '给排水', '弱电系统', '综合维修']), pick(['电气维修', '空调维修', '给排水'])],
  status: pick<MaintenanceStaff['status']>(['available', 'available', 'busy', 'off'])
}))
