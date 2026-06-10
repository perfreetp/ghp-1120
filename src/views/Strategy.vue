<template>
  <div>
    <div class="page-header">
      <h2>策略管理</h2>
      <div class="flex gap-8">
        <el-tag type="success" effect="dark">运行策略: {{ activeCount }} 条</el-tag>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card" class="strategy-tabs">
      <el-tab-pane label="空调温度策略" name="ac">
        <div class="card">
          <div class="card-title">
            <span>空调温度策略列表</span>
            <el-button type="primary" size="default" @click="openACDialog()">
              <el-icon><Plus /></el-icon> 新增策略
            </el-button>
          </div>
          <el-table :data="acList" size="default">
            <el-table-column prop="name" label="策略名称" min-width="160" />
            <el-table-column prop="zone" label="适用区域" min-width="160" />
            <el-table-column label="温度设置" width="180">
              <template #default="{ row }">
                <div class="flex-col gap-4">
                  <div class="flex gap-8">
                    <el-tag type="primary" size="small" effect="light">制冷 {{ row.coolingTemp }}℃</el-tag>
                    <el-tag type="danger" size="small" effect="light">制热 {{ row.heatingTemp }}℃</el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="运行时段" width="160">
              <template #default="{ row }">
                <span class="text-primary">{{ row.startTime }} - {{ row.endTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enable" @change="toggleAC(row)" active-text="启用" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openACDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteAC(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="照明时段策略" name="light">
        <div class="card">
          <div class="card-title">
            <span>照明策略列表</span>
            <el-button type="primary" size="default" @click="openLightDialog()">
              <el-icon><Plus /></el-icon> 新增策略
            </el-button>
          </div>
          <el-table :data="lightList" size="default">
            <el-table-column prop="name" label="策略名称" min-width="160" />
            <el-table-column prop="zone" label="适用区域" min-width="160" />
            <el-table-column label="时段设置" width="160">
              <template #default="{ row }">
                <span class="text-primary">{{ row.startTime }} - {{ row.endTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="亮度" width="180">
              <template #default="{ row }">
                <div class="flex-center gap-12">
                  <el-slider v-model="row.brightness" :min="20" :max="100" :step="5"
                    :show-tooltip="true" style="flex: 1" :disabled="true" />
                  <span class="w-12 text-right text-muted">{{ row.brightness }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enable" @change="toggleLight(row)" active-text="启用" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openLightDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteLight(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="节假日模式" name="holiday">
        <div class="card">
          <div class="card-title">
            <span>节假日模式设置</span>
            <el-button type="primary" size="default" @click="openHolidayDialog()">
              <el-icon><Plus /></el-icon> 新增节假日
            </el-button>
          </div>
          <el-table :data="holidayList" size="default">
            <el-table-column prop="name" label="名称" width="140" />
            <el-table-column label="日期范围" width="260">
              <template #default="{ row }">
                <el-tag type="warning" effect="light" size="small">
                  {{ row.dateRange[0] }} ~ {{ row.dateRange[1] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="空调" width="180">
              <template #default="{ row }">
                <div class="flex gap-8 align-center">
                  <el-tag v-if="row.acEnable" type="success" size="small">开启 限制{{ row.acTemp }}℃</el-tag>
                  <el-tag v-else type="info" size="small">关闭</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="照明" width="100">
              <template #default="{ row }">
                <el-tag :type="row.lightEnable ? 'success' : 'info'" size="small">
                  {{ row.lightEnable ? '开启' : '关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" link @click="openHolidayDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteHoliday(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="临时覆盖" name="override">
        <div class="card">
          <div class="card-title">
            <span>临时温度覆盖</span>
            <el-tag type="danger" effect="dark">临时策略优先级最高</el-tag>
            <el-button type="primary" size="default" @click="openOverrideDialog()">
              <el-icon><Plus /></el-icon> 新增覆盖
            </el-button>
          </div>
          <el-table :data="overrideList" size="default">
            <el-table-column prop="zone" label="覆盖区域" min-width="180" />
            <el-table-column label="目标温度" width="120" align="center">
              <template #default="{ row }">
                <span class="text-18 font-semibold text-danger">{{ row.targetTemp }}℃</span>
              </template>
            </el-table-column>
            <el-table-column label="生效时段" width="280">
              <template #default="{ row }">
                <div class="text-sm">
                  <div>开始: <span class="text-primary">{{ row.startTime }}</span></div>
                  <div>结束: <span class="text-warning">{{ row.endTime }}</span></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" link type="primary" @click="openOverrideDialog(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteOverride(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="acDialog.visible" :title="acDialog.isEdit ? '编辑' : '新增' + '空调策略'" width="560px">
      <el-form :model="acDialog.form" label-width="100px" :rules="ACRules" ref="acForm">
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="acDialog.form.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="适用区域" prop="zone">
          <el-input v-model="acDialog.form.zone" placeholder="请输入适用区域" />
        </el-form-item>
        <el-form-item label="制冷温度" prop="coolingTemp">
          <el-input-number v-model="acDialog.form.coolingTemp" :min="18" :max="30" :step="1" /> ℃
        </el-form-item>
        <el-form-item label="制热温度" prop="heatingTemp">
          <el-input-number v-model="acDialog.form.heatingTemp" :min="16" :max="28" :step="1" /> ℃
        </el-form-item>
        <el-form-item label="运行时段" prop="startTime">
          <el-time-select v-model="acDialog.form.startTime" start="00:00" step="00:30" end="23:30" placeholder="开始" />
          <span class="mx-8">至</span>
          <el-time-select v-model="acDialog.form.endTime" start="00:00" step="00:30" end="23:30" placeholder="结束" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="acDialog.form.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveAC">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="lightDialog.visible" :title="lightDialog.isEdit ? '编辑' : '新增' + '照明策略'" width="560px">
      <el-form :model="lightDialog.form" label-width="100px" ref="lightForm">
        <el-form-item label="策略名称">
          <el-input v-model="lightDialog.form.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="适用区域">
          <el-input v-model="lightDialog.form.zone" placeholder="请输入适用区域" />
        </el-form-item>
        <el-form-item label="运行时段">
          <el-time-select v-model="lightDialog.form.startTime" start="00:00" step="00:30" end="23:30" placeholder="开始" />
          <span class="mx-8">至</span>
          <el-time-select v-model="lightDialog.form.endTime" start="00:00" step="00:30" end="23:30" placeholder="结束" />
        </el-form-item>
        <el-form-item label="亮度">
          <el-slider v-model="lightDialog.form.brightness" :min="20" :max="100" :step="5" show-input style="width: 360px" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="lightDialog.form.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lightDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveLight">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="holidayDialog.visible" :title="holidayDialog.isEdit ? '编辑' : '新增' + '节假日模式'" width="600px">
      <el-form :model="holidayDialog.form" label-width="100px">
        <el-form-item label="模式名称">
          <el-input v-model="holidayDialog.form.name" placeholder="如：元旦假期" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="holidayDialog.form.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item label="空调启用">
          <el-switch v-model="holidayDialog.form.acEnable" />
        </el-form-item>
        <el-form-item v-if="holidayDialog.form.acEnable" label="限制温度">
          <el-input-number v-model="holidayDialog.form.acTemp" :min="20" :max="32" /> ℃
        </el-form-item>
        <el-form-item label="照明启用">
          <el-switch v-model="holidayDialog.form.lightEnable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="holidayDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveHoliday">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="overrideDialog.visible" :title="overrideDialog.isEdit ? '编辑' : '新增' + '临时覆盖'" width="600px">
      <el-form :model="overrideDialog.form" label-width="100px">
        <el-form-item label="覆盖区域">
          <el-input v-model="overrideDialog.form.zone" placeholder="如：8F 会议室A" />
        </el-form-item>
        <el-form-item label="目标温度">
          <el-input-number v-model="overrideDialog.form.targetTemp" :min="18" :max="32" /> ℃
        </el-form-item>
        <el-form-item label="生效时段">
          <el-date-picker v-model="overrideDialog.form._dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
          <div style="margin-top: 8px">
            <el-time-select v-model="overrideDialog.form._startTime" start="00:00" step="00:30" end="23:30" placeholder="开始时间" />
            <span class="mx-8">至</span>
            <el-time-select v-model="overrideDialog.form._endTime" start="00:00" step="00:30" end="23:30" placeholder="结束时间" />
          </div>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="overrideDialog.form.reason" type="textarea" :rows="2" placeholder="请输入临时调整原因" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="overrideDialog.form.operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="overrideDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveOverride">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import type { ACStrategy, LightStrategy, HolidayMode, TempOverride } from '@/types'
import { strategyService } from '@/services'

const activeTab = ref('ac')

const acList = ref<ACStrategy[]>([])
const lightList = ref<LightStrategy[]>([])
const holidayList = ref<HolidayMode[]>([])
const overrideList = ref<TempOverride[]>([])

const activeCount = computed(() =>
  acList.value.filter(a => a.enable).length + lightList.value.filter(l => l.enable).length
)

const ACRules: FormRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  zone: [{ required: true, message: '请输入适用区域', trigger: 'blur' }]
}

const acForm = ref()
const lightForm = ref()

const acDialog = ref({
  visible: false,
  isEdit: false,
  form: { id: '', name: '', zone: '', coolingTemp: 26, heatingTemp: 20, startTime: '08:00', endTime: '20:00', enable: true } as ACStrategy
})
const lightDialog = ref({
  visible: false,
  isEdit: false,
  form: { id: '', name: '', zone: '', startTime: '08:00', endTime: '20:00', brightness: 80, enable: true } as LightStrategy
})
const holidayDialog = ref({
  visible: false,
  isEdit: false,
  form: { id: '', name: '', dateRange: ['', ''] as [string, string], acEnable: false, lightEnable: true, acTemp: 28 } as HolidayMode
})
const overrideDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '', zone: '', targetTemp: 24, startTime: '', endTime: '', reason: '', operator: '',
    _dateRange: [], _startTime: '09:00', _endTime: '18:00'
  } as any
})

function openACDialog(row?: ACStrategy) {
  acDialog.value.isEdit = !!row
  acDialog.value.form = row ? { ...row } : { id: '', name: '', zone: '', coolingTemp: 26, heatingTemp: 20, startTime: '08:00', endTime: '20:00', enable: true }
  acDialog.value.visible = true
}

async function saveAC() {
  if (!acDialog.value.form.name || !acDialog.value.form.zone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const form = { ...acDialog.value.form }
  if (!acDialog.value.isEdit) form.id = 'ACS' + Date.now()
  await strategyService.saveACStrategy(form)
  if (!acDialog.value.isEdit) acList.value.push(form)
  else Object.assign(acList.value.find(x => x.id === form.id)!, form)
  acDialog.value.visible = false
  ElMessage.success('保存成功')
}

function toggleAC(row: ACStrategy) {
  strategyService.saveACStrategy(row)
  ElMessage.success(`已${row.enable ? '启用' : '停用'}`)
}

async function deleteAC(row: ACStrategy) {
  await ElMessageBox.confirm(`确认删除策略"${row.name}"？`, '提示', { type: 'warning' })
  await strategyService.deleteACStrategy(row.id)
  acList.value = acList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

function openLightDialog(row?: LightStrategy) {
  lightDialog.value.isEdit = !!row
  lightDialog.value.form = row ? { ...row } : { id: '', name: '', zone: '', startTime: '08:00', endTime: '20:00', brightness: 80, enable: true }
  lightDialog.value.visible = true
}

async function saveLight() {
  if (!lightDialog.value.form.name || !lightDialog.value.form.zone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const form = { ...lightDialog.value.form }
  if (!lightDialog.value.isEdit) form.id = 'LIS' + Date.now()
  await strategyService.saveLightStrategy(form)
  if (!lightDialog.value.isEdit) lightList.value.push(form)
  else Object.assign(lightList.value.find(x => x.id === form.id)!, form)
  lightDialog.value.visible = false
  ElMessage.success('保存成功')
}

function toggleLight(row: LightStrategy) {
  strategyService.saveLightStrategy(row)
  ElMessage.success(`已${row.enable ? '启用' : '停用'}`)
}

async function deleteLight(row: LightStrategy) {
  await ElMessageBox.confirm(`确认删除策略"${row.name}"？`, '提示', { type: 'warning' })
  await strategyService.deleteLightStrategy(row.id)
  lightList.value = lightList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

function openHolidayDialog(row?: HolidayMode) {
  holidayDialog.value.isEdit = !!row
  holidayDialog.value.form = row ? { ...row } : { id: '', name: '', dateRange: ['', ''] as [string, string], acEnable: false, lightEnable: true, acTemp: 28 }
  holidayDialog.value.visible = true
}

async function saveHoliday() {
  const form = { ...holidayDialog.value.form }
  if (!form.name || !form.dateRange[0]) { ElMessage.warning('请填写完整信息'); return }
  if (!holidayDialog.value.isEdit) form.id = 'HM' + Date.now()
  await strategyService.saveHolidayMode(form)
  if (!holidayDialog.value.isEdit) holidayList.value.push(form)
  else Object.assign(holidayList.value.find(x => x.id === form.id)!, form)
  holidayDialog.value.visible = false
  ElMessage.success('保存成功')
}

async function deleteHoliday(row: HolidayMode) {
  await ElMessageBox.confirm(`确认删除"${row.name}"？`, '提示', { type: 'warning' })
  await strategyService.deleteHolidayMode(row.id)
  holidayList.value = holidayList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

function openOverrideDialog(row?: TempOverride) {
  overrideDialog.value.isEdit = !!row
  if (row) {
    overrideDialog.value.form = {
      ...row,
      _dateRange: [row.startTime.split(' ')[0], row.endTime.split(' ')[0]],
      _startTime: row.startTime.split(' ')[1],
      _endTime: row.endTime.split(' ')[1]
    }
  } else {
    overrideDialog.value.form = {
      id: '', zone: '', targetTemp: 24, startTime: '', endTime: '', reason: '', operator: '',
      _dateRange: [], _startTime: '09:00', _endTime: '18:00'
    }
  }
  overrideDialog.value.visible = true
}

async function saveOverride() {
  const f = overrideDialog.value.form
  if (!f.zone) { ElMessage.warning('请填写完整信息'); return }
  const form: TempOverride = {
    id: f.id,
    zone: f.zone,
    targetTemp: f.targetTemp,
    startTime: `${f._dateRange[0]} ${f._startTime}`,
    endTime: `${f._dateRange[1]} ${f._endTime}`,
    reason: f.reason,
    operator: f.operator || '当前用户'
  }
  if (!overrideDialog.value.isEdit) form.id = 'TO' + Date.now()
  await strategyService.saveTempOverride(form)
  if (!overrideDialog.value.isEdit) overrideList.value.push(form)
  else Object.assign(overrideList.value.find(x => x.id === form.id)!, form)
  overrideDialog.value.visible = false
  ElMessage.success('保存成功')
}

async function deleteOverride(row: TempOverride) {
  await ElMessageBox.confirm(`确认删除该临时覆盖？`, '提示', { type: 'warning' })
  await strategyService.deleteTempOverride(row.id)
  overrideList.value = overrideList.value.filter(x => x.id !== row.id)
  ElMessage.success('删除成功')
}

onMounted(async () => {
  const [a, l, h, o] = await Promise.all([
    strategyService.getACStrategies(),
    strategyService.getLightStrategies(),
    strategyService.getHolidayModes(),
    strategyService.getTempOverrides()
  ])
  acList.value = a
  lightList.value = l
  holidayList.value = h
  overrideList.value = o
})
</script>

<style scoped>
.strategy-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.mx-8 { margin-left: 8px; margin-right: 8px; }
.text-18 { font-size: 18px; }
.font-semibold { font-weight: 600; }
.gap-4 { gap: 4px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.align-center { align-items: center; }
.w-12 { width: 48px; }
.text-right { text-align: right; }
</style>
