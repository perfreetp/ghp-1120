import type {
  EnergyData, ZoneEnergy, PeakValleyData, CostEstimate, AbnormalRank,
  RoomCurve, DeviceStatus, CompareData, ACStrategy, LightStrategy,
  HolidayMode, TempOverride, Alarm, TenantShare, DeptReconciliation,
  EnergySuggestion, WorkOrder, Floor, Tenant, Meter, Device, DeviceGroup,
  MaintenanceStaff, AlarmType, AlarmStatus, WorkOrderStatus, WorkOrderPriority, EnergyType
} from '@/types'
import {
  mockEnergyOverview, mockZoneEnergy, mockPeakValley, mockCostEstimate,
  mockAbnormalRank, mockRoomCurves, mockDeviceStatus, mockCompareData,
  mockACStrategies, mockLightStrategies, mockHolidayModes, mockTempOverrides,
  mockAlarms, mockTenantShares, mockDeptReconciliation, mockEnergySuggestions,
  mockWorkOrders, mockFloors, mockTenants, mockMeters, mockDevices,
  mockDeviceGroups, mockStaffs
} from '@/mock'

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function genHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
}

function genSeededSeries(base: number, variance: number, rand: () => number): number[] {
  return Array.from({ length: 24 }, () => {
    const v = base * (0.6 + rand() * 0.8) + rand() * variance
    return Number(v.toFixed(1))
  })
}

function getFloorRoomNames(floor: number): string[] {
  if (floor === -2) return ['高压配电室', '低压配电室', '中央空调机房', '水泵房', '电梯机房']
  if (floor === -1) return ['停车场A区', '停车场B区', '停车场C区', '出入口通道', '管理值班室']
  if (floor === 1) return ['大堂接待区', '大堂休息区', '商务中心', '便利店', '前台办公区']
  return ['会议室A', '会议室B', '开放办公区1', '开放办公区2', '经理室']
}

function genRoomCurvesForFloor(floor: number): RoomCurve[] {
  const rooms = getFloorRoomNames(floor)
  const hours = genHours()
  const isBasement = floor < 0
  const isLobby = floor === 1
  const floorFactor = 1 + Math.max(0, floor) * 0.05

  return rooms.map((name, i) => {
    const seed = (floor + 100) * 1000 + i * 137 + name.charCodeAt(0)
    const rand = seededRandom(seed)

    let electricBase = 50 + i * 10
    let waterBase = 5 + i
    let acBase = 30 + i * 5
    let lightBase = 20 + i * 3

    if (isBasement) {
      electricBase = 80 + i * 20
      waterBase = 3 + i * 0.5
      acBase = floor === -2 ? 100 + i * 30 : 10 + i * 2
      lightBase = floor === -2 ? 30 + i * 5 : 60 + i * 10
    } else if (isLobby) {
      electricBase = 60 + i * 15
      waterBase = 4 + i * 0.8
      acBase = 80 + i * 20
      lightBase = 70 + i * 15
    }

    electricBase *= floorFactor
    waterBase *= floorFactor
    acBase *= floorFactor
    lightBase *= floorFactor

    return {
      roomId: `R${floor < 0 ? 'B' + Math.abs(floor) : floor}${String(100 + i).padStart(3, '0')}`,
      roomName: name,
      floor,
      time: hours,
      electric: genSeededSeries(electricBase, 20, rand),
      water: genSeededSeries(waterBase, 3, rand),
      ac: genSeededSeries(acBase, 15, rand),
      light: genSeededSeries(lightBase, 10, rand)
    }
  })
}

function genDeviceStatusForFloor(floor: number): DeviceStatus[] {
  const result: DeviceStatus[] = []
  const isBasement = floor < 0
  const isLobby = floor === 1
  const rand = seededRandom((floor + 100) * 7919)
  const manufacturers = ['格力电器', '美的集团', '海尔智家', '西门子', '施耐德']

  const floorLabel = floor < 0 ? `B${Math.abs(floor)}` : `${floor}F`
  const runHoursBase = 500 + Math.max(0, floor) * 100
  let deviceConfigs: Array<{ type: EnergyType; names: string[]; count: number; powerRange: [number, number]; mostlyOn?: boolean }>

  if (floor === -2) {
    deviceConfigs = [
      { type: 'electric', names: ['高压柜', '变压器', '低压配电柜', 'UPS主机', '发电机'], count: 6, powerRange: [100, 400], mostlyOn: true },
      { type: 'ac', names: ['冷水机组', '冷冻水泵', '冷却水泵', '冷却塔风机', '新风机组'], count: 5, powerRange: [50, 200], mostlyOn: true },
      { type: 'water', names: ['生活水泵', '消防水泵', '中水系统', '排污泵'], count: 4, powerRange: [5, 30], mostlyOn: true },
      { type: 'light', names: ['机房照明', '走廊照明', '应急照明'], count: 3, powerRange: [2, 15] }
    ]
  } else if (floor === -1) {
    deviceConfigs = [
      { type: 'light', names: ['车道照明', '车位照明A', '车位照明B', '出入口照明', '应急照明'], count: 8, powerRange: [2, 20], mostlyOn: true },
      { type: 'electric', names: ['通风机', '道闸系统', '监控系统', '充电桩'], count: 5, powerRange: [3, 50] },
      { type: 'ac', names: ['送排风机'], count: 2, powerRange: [10, 30] }
    ]
  } else if (floor === 1) {
    deviceConfigs = [
      { type: 'ac', names: ['风机盘管大堂A', '风机盘管大堂B', '新风机组', '回风处理机'], count: 5, powerRange: [20, 80], mostlyOn: true },
      { type: 'light', names: ['大堂主照明', '大堂辅照明', '走廊照明', '门头景观灯', '应急照明'], count: 6, powerRange: [5, 40], mostlyOn: true },
      { type: 'electric', names: ['旋转门', '电梯控制', '信息屏', '安防系统'], count: 4, powerRange: [2, 30], mostlyOn: true },
      { type: 'water', names: ['卫生间供水', '绿化灌溉'], count: 2, powerRange: [1, 10] }
    ]
  } else {
    deviceConfigs = [
      { type: 'ac', names: ['风机盘管01', '风机盘管02', '风机盘管03', '新风机组'], count: 4, powerRange: [10, 50], mostlyOn: true },
      { type: 'light', names: ['办公照明A组', '办公照明B组', '走廊照明', '会议室照明', '应急照明'], count: 5, powerRange: [3, 25], mostlyOn: true },
      { type: 'electric', names: ['楼层配电箱', '插座回路', '网络机柜'], count: 3, powerRange: [10, 80], mostlyOn: true },
      { type: 'water', names: ['卫生间供水'] , count: 1, powerRange: [1, 8] }
    ]
  }

  let idCounter = 1
  const typePrefix: Record<EnergyType, string> = { electric: 'EL', water: 'WT', ac: 'AC', light: 'LT' }

  for (const cfg of deviceConfigs) {
    for (let i = 0; i < cfg.count; i++) {
      const nameTpl = cfg.names[i % cfg.names.length]
      const num = Math.floor(i / cfg.names.length) + 1
      const on = cfg.mostlyOn ? rand() < 0.95 : rand() < 0.9
      result.push({
        id: `${typePrefix[cfg.type]}${floorLabel}-${String(idCounter++).padStart(3, '0')}`,
        name: `${floorLabel}-${nameTpl}${cfg.count > cfg.names.length ? String(num).padStart(2, '0') : ''}`,
        type: cfg.type,
        room: getFloorRoomNames(floor)[i % getFloorRoomNames(floor).length],
        floor,
        status: on ? 'on' : 'off',
        power: Number((cfg.powerRange[0] + rand() * (cfg.powerRange[1] - cfg.powerRange[0])).toFixed(1)),
        runHours: Math.round(runHoursBase + rand() * 3000),
        lastUpdate: new Date(Date.now() - Math.round(rand() * 3600000)).toISOString(),
        manufacturer: manufacturers[Math.floor(rand() * manufacturers.length)]
      } as DeviceStatus & { manufacturer?: string })
    }
  }
  return result
}

export const energyService = {
  getOverview(): Promise<EnergyData[]> {
    return delay(mockEnergyOverview)
  },

  getZoneEnergy(): Promise<ZoneEnergy[]> {
    return delay(mockZoneEnergy)
  },

  getPeakValley(): Promise<PeakValleyData[]> {
    return delay(mockPeakValley)
  },

  getCostEstimate(): Promise<CostEstimate[]> {
    return delay(mockCostEstimate)
  },

  getAbnormalRank(): Promise<AbnormalRank[]> {
    return delay(mockAbnormalRank)
  },

  getHourlyTrend(type: EnergyType = 'electric'): Promise<{ time: string[]; data: number[] }> {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
    const base = type === 'electric' ? 4000 : type === 'water' ? 120 : type === 'ac' ? 2500 : 800
    const data = hours.map(() => Math.round(base * (0.5 + Math.random() * 1.2)))
    return delay({ time: hours, data })
  },

  getRoomCurves(floor?: number): Promise<RoomCurve[]> {
    if (floor !== undefined) {
      return delay(genRoomCurvesForFloor(floor))
    }
    return delay(mockRoomCurves)
  },

  getDeviceStatus(filter?: { type?: EnergyType; floor?: number; status?: string }): Promise<DeviceStatus[]> {
    let result: DeviceStatus[]
    if (filter?.floor !== undefined) {
      result = genDeviceStatusForFloor(filter.floor)
    } else {
      result = mockDeviceStatus
    }
    if (filter?.type) result = result.filter(d => d.type === filter.type)
    if (filter?.status) result = result.filter(d => d.status === filter.status)
    return delay(result)
  },

  getCompareData(): Promise<CompareData[]> {
    return delay(mockCompareData)
  }
}

export const strategyService = {
  getACStrategies(): Promise<ACStrategy[]> {
    return delay(mockACStrategies)
  },

  saveACStrategy(strategy: ACStrategy): Promise<ACStrategy> {
    const idx = mockACStrategies.findIndex(s => s.id === strategy.id)
    if (idx >= 0) mockACStrategies[idx] = strategy
    else mockACStrategies.push(strategy)
    return delay(strategy)
  },

  deleteACStrategy(id: string): Promise<boolean> {
    const idx = mockACStrategies.findIndex(s => s.id === id)
    if (idx >= 0) mockACStrategies.splice(idx, 1)
    return delay(idx >= 0)
  },

  getLightStrategies(): Promise<LightStrategy[]> {
    return delay(mockLightStrategies)
  },

  saveLightStrategy(strategy: LightStrategy): Promise<LightStrategy> {
    const idx = mockLightStrategies.findIndex(s => s.id === strategy.id)
    if (idx >= 0) mockLightStrategies[idx] = strategy
    else mockLightStrategies.push(strategy)
    return delay(strategy)
  },

  deleteLightStrategy(id: string): Promise<boolean> {
    const idx = mockLightStrategies.findIndex(s => s.id === id)
    if (idx >= 0) mockLightStrategies.splice(idx, 1)
    return delay(idx >= 0)
  },

  getHolidayModes(): Promise<HolidayMode[]> {
    return delay(mockHolidayModes)
  },

  saveHolidayMode(mode: HolidayMode): Promise<HolidayMode> {
    const idx = mockHolidayModes.findIndex(h => h.id === mode.id)
    if (idx >= 0) mockHolidayModes[idx] = mode
    else mockHolidayModes.push(mode)
    return delay(mode)
  },

  deleteHolidayMode(id: string): Promise<boolean> {
    const idx = mockHolidayModes.findIndex(h => h.id === id)
    if (idx >= 0) mockHolidayModes.splice(idx, 1)
    return delay(idx >= 0)
  },

  getTempOverrides(): Promise<TempOverride[]> {
    return delay(mockTempOverrides)
  },

  saveTempOverride(override: TempOverride): Promise<TempOverride> {
    const idx = mockTempOverrides.findIndex(o => o.id === override.id)
    if (idx >= 0) mockTempOverrides[idx] = override
    else mockTempOverrides.push(override)
    return delay(override)
  },

  deleteTempOverride(id: string): Promise<boolean> {
    const idx = mockTempOverrides.findIndex(o => o.id === id)
    if (idx >= 0) mockTempOverrides.splice(idx, 1)
    return delay(idx >= 0)
  }
}

export const alarmService = {
  getAlarms(filter?: {
    type?: AlarmType
    status?: AlarmStatus
    level?: Alarm['level']
    keyword?: string
  }): Promise<Alarm[]> {
    let result = mockAlarms
    if (filter?.type) result = result.filter(a => a.type === filter.type)
    if (filter?.status) result = result.filter(a => a.status === filter.status)
    if (filter?.level) result = result.filter(a => a.level === filter.level)
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(kw) ||
        a.location.toLowerCase().includes(kw) ||
        (a.device && a.device.toLowerCase().includes(kw))
      )
    }
    return delay(result)
  },

  getAlarmById(id: string): Promise<Alarm | undefined> {
    return delay(mockAlarms.find(a => a.id === id))
  },

  handleAlarm(id: string, note: string, handler: string): Promise<Alarm | undefined> {
    const alarm = mockAlarms.find(a => a.id === id)
    if (alarm) {
      alarm.status = 'processing'
      alarm.handler = handler
      alarm.handleTime = new Date().toISOString()
      alarm.handleNote = note
    }
    return delay(alarm)
  },

  resolveAlarm(id: string, note: string): Promise<Alarm | undefined> {
    const alarm = mockAlarms.find(a => a.id === id)
    if (alarm) {
      alarm.status = 'resolved'
      alarm.handleNote = note
    }
    return delay(alarm)
  },

  closeAlarm(id: string): Promise<Alarm | undefined> {
    const alarm = mockAlarms.find(a => a.id === id)
    if (alarm) alarm.status = 'closed'
    return delay(alarm)
  },

  getStats(): Promise<{ pending: number; processing: number; resolved: number; closed: number; critical: number }> {
    const stats = {
      pending: mockAlarms.filter(a => a.status === 'pending').length,
      processing: mockAlarms.filter(a => a.status === 'processing').length,
      resolved: mockAlarms.filter(a => a.status === 'resolved').length,
      closed: mockAlarms.filter(a => a.status === 'closed').length,
      critical: mockAlarms.filter(a => a.level === 'critical' && a.status !== 'closed').length
    }
    return delay(stats)
  }
}

export const reportService = {
  getTenantShares(month?: string): Promise<TenantShare[]> {
    return delay(mockTenantShares)
  },

  getDeptReconciliation(month?: string): Promise<DeptReconciliation[]> {
    return delay(mockDeptReconciliation)
  },

  getEnergySuggestions(): Promise<EnergySuggestion[]> {
    return delay(mockEnergySuggestions)
  },

  saveSuggestion(suggestion: EnergySuggestion): Promise<EnergySuggestion> {
    const idx = mockEnergySuggestions.findIndex(s => s.id === suggestion.id)
    if (idx >= 0) mockEnergySuggestions[idx] = suggestion
    else mockEnergySuggestions.push(suggestion)
    return delay(suggestion)
  },

  exportReport(type: 'tenant' | 'dept' | 'suggestion', format: 'excel' | 'pdf'): Promise<string> {
    return delay(`报表已导出：${type}_report_${new Date().getTime()}.${format}`)
  }
}

export const workOrderService = {
  getWorkOrders(filter?: {
    status?: WorkOrderStatus
    priority?: WorkOrderPriority
    assignee?: string
    keyword?: string
  }): Promise<WorkOrder[]> {
    let result = mockWorkOrders
    if (filter?.status) result = result.filter(w => w.status === filter.status)
    if (filter?.priority) result = result.filter(w => w.priority === filter.priority)
    if (filter?.assignee) result = result.filter(w => w.assignee === filter.assignee)
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(w =>
        w.title.toLowerCase().includes(kw) ||
        w.location.toLowerCase().includes(kw)
      )
    }
    return delay(result)
  },

  getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
    return delay(mockWorkOrders.find(w => w.id === id))
  },

  createWorkOrder(order: Omit<WorkOrder, 'id' | 'createTime' | 'creator'>): Promise<WorkOrder> {
    const newOrder: WorkOrder = {
      ...order,
      id: `WO${Date.now()}`,
      createTime: new Date().toISOString(),
      creator: '当前用户'
    }
    mockWorkOrders.unshift(newOrder)
    return delay(newOrder)
  },

  assignWorkOrder(id: string, assignee: string, assigneePhone: string): Promise<WorkOrder | undefined> {
    const order = mockWorkOrders.find(w => w.id === id)
    if (order) {
      order.status = 'assigned'
      order.assignee = assignee
      order.assigneePhone = assigneePhone
      order.assignTime = new Date().toISOString()
    }
    return delay(order)
  },

  startWorkOrder(id: string, note: string): Promise<WorkOrder | undefined> {
    const order = mockWorkOrders.find(w => w.id === id)
    if (order) {
      order.status = 'processing'
      order.processTime = new Date().toISOString()
      order.processNote = note
    }
    return delay(order)
  },

  completeWorkOrder(id: string, result: string): Promise<WorkOrder | undefined> {
    const order = mockWorkOrders.find(w => w.id === id)
    if (order) {
      order.status = 'completed'
      order.completeTime = new Date().toISOString()
      order.result = result
    }
    return delay(order)
  },

  verifyWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const order = mockWorkOrders.find(w => w.id === id)
    if (order) {
      order.status = 'verified'
      order.verifyTime = new Date().toISOString()
    }
    return delay(order)
  },

  closeWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const order = mockWorkOrders.find(w => w.id === id)
    if (order) {
      order.status = 'closed'
      order.closeTime = new Date().toISOString()
    }
    return delay(order)
  },

  getStaffs(): Promise<MaintenanceStaff[]> {
    return delay(mockStaffs)
  },

  getStats(): Promise<Record<string, number>> {
    const statuses: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'completed', 'verified', 'closed']
    const stats: Record<string, number> = {}
    statuses.forEach(s => { stats[s] = mockWorkOrders.filter(w => w.status === s).length })
    stats.total = mockWorkOrders.length
    stats.urgent = mockWorkOrders.filter(w => w.priority === 'urgent' && !['closed', 'verified'].includes(w.status)).length
    return delay(stats)
  }
}

export const archiveService = {
  getFloors(): Promise<Floor[]> {
    return delay(mockFloors)
  },

  saveFloor(floor: Floor): Promise<Floor> {
    const idx = mockFloors.findIndex(f => f.id === floor.id)
    if (idx >= 0) mockFloors[idx] = floor
    else mockFloors.push(floor)
    return delay(floor)
  },

  deleteFloor(id: string): Promise<boolean> {
    const idx = mockFloors.findIndex(f => f.id === id)
    if (idx >= 0) mockFloors.splice(idx, 1)
    return delay(idx >= 0)
  },

  getTenants(keyword?: string): Promise<Tenant[]> {
    let result = mockTenants
    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.shortName.toLowerCase().includes(kw) ||
        t.room.toLowerCase().includes(kw)
      )
    }
    return delay(result)
  },

  saveTenant(tenant: Tenant): Promise<Tenant> {
    const idx = mockTenants.findIndex(t => t.id === tenant.id)
    if (idx >= 0) mockTenants[idx] = tenant
    else mockTenants.push(tenant)
    return delay(tenant)
  },

  deleteTenant(id: string): Promise<boolean> {
    const idx = mockTenants.findIndex(t => t.id === id)
    if (idx >= 0) mockTenants.splice(idx, 1)
    return delay(idx >= 0)
  },

  getMeters(filter?: { type?: EnergyType; status?: string; keyword?: string }): Promise<Meter[]> {
    let result = mockMeters
    if (filter?.type) result = result.filter(m => m.type === filter.type)
    if (filter?.status) result = result.filter(m => m.status === filter.status)
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        m.code.toLowerCase().includes(kw) ||
        m.location.toLowerCase().includes(kw)
      )
    }
    return delay(result)
  },

  saveMeter(meter: Meter): Promise<Meter> {
    const idx = mockMeters.findIndex(m => m.id === meter.id)
    if (idx >= 0) mockMeters[idx] = meter
    else mockMeters.push(meter)
    return delay(meter)
  },

  deleteMeter(id: string): Promise<boolean> {
    const idx = mockMeters.findIndex(m => m.id === id)
    if (idx >= 0) mockMeters.splice(idx, 1)
    return delay(idx >= 0)
  },

  getDevices(filter?: { type?: EnergyType; status?: string; groupId?: string; keyword?: string }): Promise<Device[]> {
    let result = mockDevices
    if (filter?.type) result = result.filter(d => d.type === filter.type)
    if (filter?.status) result = result.filter(d => d.status === filter.status)
    if (filter?.groupId) result = result.filter(d => d.groupId === filter.groupId)
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(d =>
        d.name.toLowerCase().includes(kw) ||
        d.code.toLowerCase().includes(kw) ||
        d.location.toLowerCase().includes(kw)
      )
    }
    return delay(result)
  },

  saveDevice(device: Device): Promise<Device> {
    const idx = mockDevices.findIndex(d => d.id === device.id)
    if (idx >= 0) mockDevices[idx] = device
    else mockDevices.push(device)
    return delay(device)
  },

  deleteDevice(id: string): Promise<boolean> {
    const idx = mockDevices.findIndex(d => d.id === id)
    if (idx >= 0) mockDevices.splice(idx, 1)
    return delay(idx >= 0)
  },

  getDeviceGroups(): Promise<DeviceGroup[]> {
    return delay(mockDeviceGroups)
  },

  saveDeviceGroup(group: DeviceGroup): Promise<DeviceGroup> {
    const idx = mockDeviceGroups.findIndex(g => g.id === group.id)
    if (idx >= 0) mockDeviceGroups[idx] = group
    else mockDeviceGroups.push(group)
    return delay(group)
  },

  deleteDeviceGroup(id: string): Promise<boolean> {
    const idx = mockDeviceGroups.findIndex(g => g.id === id)
    if (idx >= 0) mockDeviceGroups.splice(idx, 1)
    return delay(idx >= 0)
  }
}
