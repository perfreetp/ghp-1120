<template>
  <div>
    <div class="page-header">
      <h2>档案管理</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="楼层档案" name="floor">
        <div class="card mb-0">
          <div class="card-title">
            <span>楼层列表</span>
            <el-button type="primary" @click="openFloorDialog()">
              <el-icon><Plus /></el-icon> 新增楼层
            </el-button>
          </div>
          <el-table :data="floorList" size="default" stripe>
            <el-table-column prop="id" label="编号" width="100" />
            <el-table-column prop="number" label="楼层号" width="100" align="center">
              <template #default="{ row }">
                <span :class="row.number < 0 ? 'text-warning' : ''">
                  {{ row.number > 0 ? row.number + 'F' : 'B' + Math.abs(row.number) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="楼层名称" min-width="160" />
            <el-table-column prop="area" label="面积(㎡)" width="120" align="right">
              <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="height" label="层高(m)" width="100" align="right" />
            <el-table-column prop="roomCount" label="房间数" width="100" align="center" />
            <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openFloorDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteFloor(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="租户档案" name="tenant">
        <div class="card mb-0">
          <div class="card-title">
            <span>租户列表</span>
            <div class="flex gap-8">
              <el-input v-model="tenantKeyword" placeholder="搜索租户名称/房间号" clearable style="width: 220px" @keyup.enter="loadTenants" />
              <el-button type="primary" @click="openTenantDialog()">
                <el-icon><Plus /></el-icon> 新增租户
              </el-button>
            </div>
          </div>
          <el-table :data="tenantList" size="default" stripe>
            <el-table-column prop="id" label="编号" width="100" fixed="left" />
            <el-table-column prop="name" label="租户名称" min-width="180" fixed="left">
              <template #default="{ row }">
                <div class="font-semibold">{{ row.name }}</div>
                <div class="text-sm text-muted">{{ row.shortName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="位置" width="160">
              <template #default="{ row }">
                <div>{{ row.room }}</div>
                <div class="text-sm text-muted">{{ row.floor }}F</div>
              </template>
            </el-table-column>
            <el-table-column prop="area" label="面积(㎡)" width="110" align="right">
              <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="联系人" width="180">
              <template #default="{ row }">
                <div>{{ row.contact }}</div>
                <div class="text-sm text-muted">{{ row.phone }}</div>
                <div class="text-sm text-muted">{{ row.email }}</div>
              </template>
            </el-table-column>
            <el-table-column label="合同期" width="220">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.contractStart }} ~ {{ row.contractEnd }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" size="small">
                  {{ tenantStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openTenantDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteTenant(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="表计档案" name="meter">
        <div class="card mb-0">
          <div class="card-title">
            <span>表计列表 (共 {{ meterList.length }} 块)</span>
            <div class="flex gap-8">
              <el-select v-model="meterFilter.type" placeholder="类型" clearable style="width: 120px">
                <el-option label="用电" value="electric" />
                <el-option label="用水" value="water" />
                <el-option label="空调" value="ac" />
                <el-option label="照明" value="light" />
              </el-select>
              <el-select v-model="meterFilter.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="正常" value="normal" />
                <el-option label="故障" value="fault" />
                <el-option label="离线" value="offline" />
              </el-select>
              <el-input v-model="meterFilter.keyword" placeholder="搜索名称/编号" clearable style="width: 200px" />
              <el-button type="primary" @click="loadMeters; openMeterDialog()">
                <el-icon><Plus /></el-icon> 新增表计
              </el-button>
            </div>
          </div>
          <el-table :data="filteredMeters" size="default" stripe>
            <el-table-column prop="code" label="表号" width="140" fixed="left" />
            <el-table-column prop="name" label="名称" min-width="160" fixed="left" />
            <el-table-column prop="type" label="类型" width="90">
              <template #default="{ row }">
                <el-tag :class="`tag-${row.type}`" size="small" effect="light">{{ typeLabels[row.type] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" min-width="140" />
            <el-table-column prop="floor" label="楼层" width="80" align="center" />
            <el-table-column label="厂商/型号" min-width="180">
              <template #default="{ row }">
                <div>{{ row.manufacturer }}</div>
                <div class="text-sm text-muted">{{ row.model }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="installDate" label="安装日期" width="120" />
            <el-table-column label="最新抄表" width="200">
              <template #default="{ row }">
                <div>读数: <span class="text-primary font-semibold">{{ row.lastValue }}</span> × {{ row.multiplier }}</div>
                <div class="text-sm text-muted">{{ formatTime(row.lastRead) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'normal' ? 'success' : row.status === 'fault' ? 'danger' : 'warning'" size="small" effect="dark" round>
                  {{ meterStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openMeterDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteMeter(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="设备分组" name="device">
        <div class="grid-2 mb-0">
          <div class="card mb-0" style="min-height: 600px;">
            <div class="card-title">
              <span>设备分组</span>
              <el-button type="primary" size="small" @click="openGroupDialog()">
                <el-icon><Plus /></el-icon> 新增
              </el-button>
            </div>
            <el-table :data="groupList" size="default" stripe>
              <el-table-column prop="name" label="分组名称" min-width="160" />
              <el-table-column prop="type" label="类型" width="90">
                <template #default="{ row }">
                  <el-tag :class="`tag-${row.type}`" size="small" effect="light">{{ typeLabels[row.type] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="deviceCount" label="设备数" width="90" align="center" />
              <el-table-column prop="description" label="说明" min-width="140" show-overflow-tooltip />
              <el-table-column label="操作" width="140" align="center">
                <template #default="{ row }">
                  <el-button size="small" link @click="selectGroup(row)">{{ selectedGroup?.id === row.id ? '已选' : '查看' }}</el-button>
                  <el-button size="small" link type="danger" @click="deleteGroup(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="card mb-0" style="min-height: 600px;">
            <div class="card-title">
              <span>设备列表 {{ selectedGroup ? `(${selectedGroup.name})` : '' }}</span>
              <div class="flex gap-8">
                <el-select v-model="deviceFilter.type" placeholder="类型" clearable style="width: 110px">
                  <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
                </el-select>
                <el-button type="primary" size="small" @click="openDeviceDialog()">
                  <el-icon><Plus /></el-icon> 新增
                </el-button>
              </div>
            </div>
            <el-table :data="filteredDevices" size="default" stripe max-height="520">
              <el-table-column prop="code" label="编号" width="120" />
              <el-table-column prop="name" label="名称" min-width="140" />
              <el-table-column prop="type" label="类型" width="70">
                <template #default="{ row }">
                  <el-tag size="small" :class="`tag-${row.type}`" effect="light">{{ shortLabels[row.type] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="分类" width="90" />
              <el-table-column prop="location" label="位置" min-width="110" show-overflow-tooltip />
              <el-table-column prop="power" label="功率(kW)" width="90" align="right">
                <template #default="{ row }">{{ row.power }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="deviceStatusTag[row.status]" size="small" effect="dark" round>
                    {{ deviceStatusMap[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button size="small" link @click="openDeviceDialog(row)">编辑</el-button>
                  <el-button size="small" link type="danger" @click="deleteDevice(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="floorDialog.visible" :title="floorDialog.isEdit ? '编辑' : '新增' + '楼层'" width="520px">
      <el-form :model="floorDialog.form" label-width="100px">
        <el-form-item label="楼层号"><el-input-number v-model="floorDialog.form.number" :min="-10" :max="100" /></el-form-item>
        <el-form-item label="楼层名称"><el-input v-model="floorDialog.form.name" /></el-form-item>
        <el-form-item label="面积(㎡)"><el-input-number v-model="floorDialog.form.area" :min="0" :max="100000" style="width: 100%" /></el-form-item>
        <el-form-item label="层高(m)"><el-input-number v-model="floorDialog.form.height" :min="2" :max="20" :step="0.1" /></el-form-item>
        <el-form-item label="房间数"><el-input-number v-model="floorDialog.form.roomCount" :min="0" :max="500" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="floorDialog.form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="floorDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveFloor">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tenantDialog.visible" :title="tenantDialog.isEdit ? '编辑' : '新增' + '租户'" width="640px">
      <el-form :model="tenantDialog.form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="租户名称"><el-input v-model="tenantDialog.form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="简称"><el-input v-model="tenantDialog.form.shortName" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="楼层"><el-input-number v-model="tenantDialog.form.floor" :min="1" :max="100" /></el-form-item></el-col>
          <el-col :span="16"><el-form-item label="房间号"><el-input v-model="tenantDialog.form.room" placeholder="如: 6F-101" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="面积(㎡)"><el-input-number v-model="tenantDialog.form.area" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态">
            <el-select v-model="tenantDialog.form.status" style="width: 100%">
              <el-option v-for="(v, k) in tenantStatusMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系人"><el-input v-model="tenantDialog.form.contact" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="电话"><el-input v-model="tenantDialog.form.phone" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="邮箱"><el-input v-model="tenantDialog.form.email" /></el-form-item></el-col>
          <el-col :span="24">
            <el-form-item label="合同期">
              <el-date-picker v-model="tenantDialog.form._range" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="tenantDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveTenant">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="meterDialog.visible" :title="meterDialog.isEdit ? '编辑' : '新增' + '表计'" width="640px">
      <el-form :model="meterDialog.form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="表编号"><el-input v-model="meterDialog.form.code" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="表名称"><el-input v-model="meterDialog.form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="类型">
            <el-select v-model="meterDialog.form.type" style="width: 100%">
              <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态">
            <el-select v-model="meterDialog.form.status" style="width: 100%">
              <el-option v-for="(v, k) in meterStatusMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="位置"><el-input v-model="meterDialog.form.location" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="楼层"><el-input-number v-model="meterDialog.form.floor" :min="-10" :max="100" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="房间"><el-input v-model="meterDialog.form.room" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="厂商"><el-input v-model="meterDialog.form.manufacturer" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="型号"><el-input v-model="meterDialog.form.model" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="安装日期"><el-date-picker v-model="meterDialog.form.installDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="倍率"><el-input-number v-model="meterDialog.form.multiplier" :min="1" :max="10000" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="初始读数"><el-input-number v-model="meterDialog.form.lastValue" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="meterDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveMeter">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="groupDialog.visible" :title="groupDialog.isEdit ? '编辑' : '新增' + '设备分组'" width="480px">
      <el-form :model="groupDialog.form" label-width="100px">
        <el-form-item label="分组名称"><el-input v-model="groupDialog.form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="groupDialog.form.type" style="width: 100%">
            <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="groupDialog.form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveGroup">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deviceDialog.visible" :title="deviceDialog.isEdit ? '编辑' : '新增' + '设备'" width="640px">
      <el-form :model="deviceDialog.form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="设备编号"><el-input v-model="deviceDialog.form.code" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="设备名称"><el-input v-model="deviceDialog.form.name" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="类型">
            <el-select v-model="deviceDialog.form.type" style="width: 100%">
              <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="分类"><el-input v-model="deviceDialog.form.category" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="功率(kW)"><el-input-number v-model="deviceDialog.form.power" :min="0" :precision="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="位置"><el-input v-model="deviceDialog.form.location" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="楼层"><el-input-number v-model="deviceDialog.form.floor" :min="-10" :max="100" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="房间"><el-input v-model="deviceDialog.form.room" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="厂商"><el-input v-model="deviceDialog.form.manufacturer" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="型号"><el-input v-model="deviceDialog.form.model" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安装日期"><el-date-picker v-model="deviceDialog.form.installDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属分组">
            <el-select v-model="deviceDialog.form.groupId" style="width: 100%" clearable>
              <el-option v-for="g in groupList" :key="g.id" :label="g.name" :value="g.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态">
            <el-select v-model="deviceDialog.form.status" style="width: 100%">
              <el-option v-for="(v, k) in deviceStatusMap" :key="k" :label="v" :value="k" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveDevice">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Floor, Tenant, Meter, Device, DeviceGroup, EnergyType } from '@/types'
import { archiveService } from '@/services'

const activeTab = ref('floor')

const typeLabels: Record<EnergyType, string> = { electric: '用电', water: '用水', ac: '空调', light: '照明' }
const shortLabels: Record<EnergyType, string> = { electric: '电', water: '水', ac: '空调', light: '照明' }
const tenantStatusMap: Record<string, string> = { active: '正常', inactive: '已退', pending: '待入驻' }
const meterStatusMap: Record<string, string> = { normal: '正常', fault: '故障', offline: '离线' }
const deviceStatusMap: Record<string, string> = { running: '运行', stopped: '停机', fault: '故障', offline: '离线' }
const deviceStatusTag: Record<string, any> = { running: 'success', stopped: 'info', fault: 'danger', offline: 'warning' }

const floorList = ref<Floor[]>([])
const tenantList = ref<Tenant[]>([])
const meterList = ref<Meter[]>([])
const deviceList = ref<Device[]>([])
const groupList = ref<DeviceGroup[]>([])

const tenantKeyword = ref('')
const meterFilter = reactive({ type: '' as EnergyType | '', status: '', keyword: '' })
const deviceFilter = reactive({ type: '' as EnergyType | '' })
const selectedGroup = ref<DeviceGroup | null>(null)

const filteredMeters = computed(() => {
  let r = meterList.value
  if (meterFilter.type) r = r.filter(m => m.type === meterFilter.type)
  if (meterFilter.status) r = r.filter(m => m.status === meterFilter.status)
  if (meterFilter.keyword) {
    const kw = meterFilter.keyword.toLowerCase()
    r = r.filter(m => m.name.toLowerCase().includes(kw) || m.code.toLowerCase().includes(kw) || m.location.toLowerCase().includes(kw))
  }
  return r
})

const filteredDevices = computed(() => {
  let r = deviceList.value
  if (selectedGroup.value) r = r.filter(d => d.groupId === selectedGroup.value?.id)
  if (deviceFilter.type) r = r.filter(d => d.type === deviceFilter.type)
  return r
})

function selectGroup(g: DeviceGroup) { selectedGroup.value = selectedGroup.value?.id === g.id ? null : g }

function formatTime(s: string): string { return new Date(s).toLocaleString('zh-CN') }

const floorDialog = ref({
  visible: false, isEdit: false,
  form: { id: '', name: '', number: 1, area: 0, height: 3.6, roomCount: 0, description: '' } as Floor
})
function openFloorDialog(row?: Floor) {
  floorDialog.value.isEdit = !!row
  floorDialog.value.form = row ? { ...row } : { id: '', name: '', number: 1, area: 0, height: 3.6, roomCount: 0, description: '' }
  floorDialog.value.visible = true
}
async function saveFloor() {
  const f = { ...floorDialog.value.form }
  if (!f.name) { ElMessage.warning('请填写楼层名称'); return }
  if (!floorDialog.value.isEdit) f.id = 'F' + Date.now()
  await archiveService.saveFloor(f)
  if (!floorDialog.value.isEdit) floorList.value.push(f)
  else Object.assign(floorList.value.find(x => x.id === f.id)!, f)
  floorDialog.value.visible = false
  ElMessage.success('保存成功')
}
async function deleteFloor(row: Floor) {
  await ElMessageBox.confirm(`确认删除楼层"${row.name}"？`, '提示', { type: 'warning' })
  await archiveService.deleteFloor(row.id)
  floorList.value = floorList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

const tenantDialog = ref({
  visible: false, isEdit: false,
  form: {
    id: '', name: '', shortName: '', floor: 1, room: '', area: 0, contact: '', phone: '', email: '',
    contractStart: '', contractEnd: '', status: 'active',
    _range: [] as any
  } as any
})
function openTenantDialog(row?: Tenant) {
  tenantDialog.value.isEdit = !!row
  if (row) {
    tenantDialog.value.form = { ...row, _range: [row.contractStart, row.contractEnd] }
  } else {
    tenantDialog.value.form = {
      id: '', name: '', shortName: '', floor: 1, room: '', area: 0, contact: '', phone: '', email: '',
      contractStart: '', contractEnd: '', status: 'active', _range: []
    }
  }
  tenantDialog.value.visible = true
}
async function saveTenant() {
  const f = tenantDialog.value.form
  if (!f.name) { ElMessage.warning('请填写租户名称'); return }
  const data: Tenant = { ...f, contractStart: f._range?.[0] || f.contractStart, contractEnd: f._range?.[1] || f.contractEnd }
  delete (data as any)._range
  if (!tenantDialog.value.isEdit) data.id = 'TE' + Date.now()
  await archiveService.saveTenant(data)
  if (!tenantDialog.value.isEdit) tenantList.value.push(data)
  else Object.assign(tenantList.value.find(x => x.id === data.id)!, data)
  tenantDialog.value.visible = false
  ElMessage.success('保存成功')
}
async function deleteTenant(row: Tenant) {
  await ElMessageBox.confirm(`确认删除租户"${row.name}"？`, '提示', { type: 'warning' })
  await archiveService.deleteTenant(row.id)
  tenantList.value = tenantList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}
async function loadTenants() {
  tenantList.value = await archiveService.getTenants(tenantKeyword.value)
}

const meterDialog = ref({
  visible: false, isEdit: false,
  form: {
    id: '', code: '', name: '', type: 'electric' as EnergyType, location: '', floor: 1, room: '',
    manufacturer: '', model: '', installDate: '', lastRead: '', lastValue: 0, multiplier: 1, status: 'normal'
  } as Meter
})
function openMeterDialog(row?: Meter) {
  meterDialog.value.isEdit = !!row
  meterDialog.value.form = row ? { ...row } : {
    id: '', code: '', name: '', type: 'electric', location: '', floor: 1, room: '',
    manufacturer: '', model: '', installDate: '', lastRead: new Date().toISOString(), lastValue: 0, multiplier: 1, status: 'normal'
  }
  meterDialog.value.visible = true
}
async function saveMeter() {
  const f = { ...meterDialog.value.form }
  if (!f.code || !f.name) { ElMessage.warning('请填写完整信息'); return }
  if (!meterDialog.value.isEdit) f.id = 'M' + Date.now()
  await archiveService.saveMeter(f)
  if (!meterDialog.value.isEdit) meterList.value.push(f)
  else Object.assign(meterList.value.find(x => x.id === f.id)!, f)
  meterDialog.value.visible = false
  ElMessage.success('保存成功')
}
async function deleteMeter(row: Meter) {
  await ElMessageBox.confirm(`确认删除表计"${row.name}"？`, '提示', { type: 'warning' })
  await archiveService.deleteMeter(row.id)
  meterList.value = meterList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}
async function loadMeters() {
  const f: any = {}
  if (meterFilter.type) f.type = meterFilter.type
  if (meterFilter.status) f.status = meterFilter.status
  if (meterFilter.keyword) f.keyword = meterFilter.keyword
  meterList.value = await archiveService.getMeters(f)
}

const groupDialog = ref({
  visible: false, isEdit: false,
  form: { id: '', name: '', type: 'electric' as EnergyType, description: '', deviceCount: 0, deviceIds: [] } as DeviceGroup
})
function openGroupDialog(row?: DeviceGroup) {
  groupDialog.value.isEdit = !!row
  groupDialog.value.form = row ? { ...row } : { id: '', name: '', type: 'electric', description: '', deviceCount: 0, deviceIds: [] }
  groupDialog.value.visible = true
}
async function saveGroup() {
  const f = { ...groupDialog.value.form }
  if (!f.name) { ElMessage.warning('请填写分组名称'); return }
  if (!groupDialog.value.isEdit) f.id = 'GRP' + Date.now()
  await archiveService.saveDeviceGroup(f)
  if (!groupDialog.value.isEdit) groupList.value.push(f)
  else Object.assign(groupList.value.find(x => x.id === f.id)!, f)
  groupDialog.value.visible = false
  ElMessage.success('保存成功')
}
async function deleteGroup(row: DeviceGroup) {
  await ElMessageBox.confirm(`确认删除分组"${row.name}"？`, '提示', { type: 'warning' })
  await archiveService.deleteDeviceGroup(row.id)
  groupList.value = groupList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

const deviceDialog = ref({
  visible: false, isEdit: false,
  form: {
    id: '', code: '', name: '', type: 'electric' as EnergyType, category: '', location: '', floor: 1, room: '',
    power: 0, manufacturer: '', model: '', installDate: '', groupId: '', status: 'running'
  } as Device
})
function openDeviceDialog(row?: Device) {
  deviceDialog.value.isEdit = !!row
  deviceDialog.value.form = row ? { ...row } : {
    id: '', code: '', name: '', type: 'electric', category: '', location: '', floor: 1, room: '',
    power: 0, manufacturer: '', model: '', installDate: '', groupId: selectedGroup.value?.id || '', status: 'running'
  }
  deviceDialog.value.visible = true
}
async function saveDevice() {
  const f = { ...deviceDialog.value.form }
  if (!f.code || !f.name) { ElMessage.warning('请填写完整信息'); return }
  if (!deviceDialog.value.isEdit) f.id = 'DEV' + Date.now()
  await archiveService.saveDevice(f)
  if (!deviceDialog.value.isEdit) deviceList.value.push(f)
  else Object.assign(deviceList.value.find(x => x.id === f.id)!, f)
  deviceDialog.value.visible = false
  ElMessage.success('保存成功')
}
async function deleteDevice(row: Device) {
  await ElMessageBox.confirm(`确认删除设备"${row.name}"？`, '提示', { type: 'warning' })
  await archiveService.deleteDevice(row.id)
  deviceList.value = deviceList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

watch([tenantKeyword, meterFilter], () => {
  if (activeTab.value === 'tenant') loadTenants()
  if (activeTab.value === 'meter') loadMeters()
}, { deep: true })

onMounted(async () => {
  const [f, t, m, d, g] = await Promise.all([
    archiveService.getFloors(),
    archiveService.getTenants(),
    archiveService.getMeters(),
    archiveService.getDevices(),
    archiveService.getDeviceGroups()
  ])
  floorList.value = f
  tenantList.value = t
  meterList.value = m
  deviceList.value = d
  groupList.value = g
})
</script>
