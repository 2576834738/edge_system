<script setup lang="ts">
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  reactive,
  ref,
} from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox,
  CheckboxGroup,
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  Row,
  Select,
  SelectOption,
  Slider,
} from 'ant-design-vue';

import { mediaFetch, scheduleFetch, suitFetch, taskConfig } from '#/api';

const emit = defineEmits(['confirm']);
const { appContext } = getCurrentInstance() as ComponentInternalInstance;
const task = ref({} as any);
const crowd_level = ref([10, 20] as any);
const marks = ref({
  10: '空闲',
  15: '正常',
  20: '拥挤',
});
const mediaArr = ref([] as any);
const scheduleArr = ref([] as any);
const suitArr = ref([] as any);
const enableSuite = ref(false);
const enableCrowd = ref(false);
const param_val = ref({} as any);
const param_vec = reactive([] as any);
const param_required = reactive([] as any);
const selector_opts = reactive([] as any);
const algArrs = ref(appContext.app.config.globalProperties.$AlgoList);
function on_crowd_changed(e: any) {
  const tmp = {} as any;
  tmp[(1 + e[0]) / 2] = '空闲';
  tmp[(e[1] + e[0]) / 2] = '正常';
  tmp[(e[1] + 100) / 2] = '拥挤';
  marks.value = tmp;
}

function show_crowd_tips(e: any) {
  return `${e} 人`;
}
const changeAlgos = (value: any) => {
  param_vec.length = 0;
  param_required.length = 0;
  for (const j in algArrs.value) {
    for (const x in value) {
      if (algArrs.value[j].name === value[x]) {
        if (
          algArrs.value[j].parameters &&
          algArrs.value[j].parameters.length > 0
        ) {
          param_vec.push({
            algo: algArrs.value[j].name,
            params: algArrs.value[j].parameters,
          });
          for (const p of algArrs.value[j].parameters) {
            if (p.type === 5) {
              selector_opts[p.key] = p.options;
            }
            param_required.push({
              name: p.name,
              key: p.key,
              required: p.required,
              type: p.type,
              max: p.max,
              min: p.min,
            });
            if (
              !(p.key in param_val.value) ||
              param_val.value[p.key] === undefined ||
              param_val.value[p.key] === ''
            ) {
              switch (p.type) {
                case 2: {
                  param_val.value[p.key] = Number.parseFloat(p.default).toFixed(
                    2,
                  );
                  break;
                }
                case 4: {
                  param_val.value[p.key] =
                    p.default === 'true' || p.default === true;
                  break;
                }
                case 5: {
                  param_val.value[p.key] = p.default < 0 ? null : p.default;
                  break;
                }
                default: {
                  param_val.value[p.key] = p.default;
                }
              }
            }
          }
        }
        if (algArrs.value[j].item === 60) {
          enableSuite.value = true;
        }
        if (algArrs.value[j].item === 54) {
          enableCrowd.value = true;
        }
      }
    }
  }
};
function changeFloat(e: any, key: any) {
  e = e.replaceAll(/[^\d.]/g, '');
  e = e.replaceAll(/\.{2,}/g, '.');
  e = e.replaceAll(/^\./g, '');
  e = e.replaceAll(/\.$/g, '');
  e = e.replace('.', '$#$').replaceAll('.', '').replace('$#$', '.');
  e = e.replace(/^(-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
  param_val.value[key] = e;
}
const [Modal, modalApi] = useVbenModal({
  class: 'w-[60vw]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  fullscreen: true,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>().content;
      if (data) {
        task.value = { ...data };
        for (const alg of task.value.AlgInfo) {
          if (alg === 54) {
            enableCrowd.value = true;
          }
        }
        if (task.value.UserData) {
          if (task.value.UserData.MethodConfig) {
            for (const n in task.value.UserData.MethodConfig) {
              if (task.value.UserData.MethodConfig[n] === 60) {
                enableSuite.value = true;
              }
            }
          }

          for (const item in task.value.UserData) {
            if (item !== 'MethodConfig') {
              param_val.value[item] = task.value.UserData[item];
            }
          }

          if (
            task.value.UserData.crowd_level_high &&
            task.value.UserData.crowd_level_lower
          ) {
            crowd_level.value = [
              task.value.UserData.crowd_level_lower,
              task.value.UserData.crowd_level_high,
            ];
          }
        }
        task.value.BaseAlgItemName = task.value.BaseAlgItem.map((e: any) => {
          return e.name;
        });
        changeAlgos(task.value.BaseAlgItemName);
      }
      mediaFetch().then((res) => {
        if (res.Result.Code === 0) {
          mediaArr.value = res.Content;
        }
      });
      scheduleFetch().then((res) => {
        if (res.Result.Code === 0) {
          scheduleArr.value = res.Result.Content;
        }
      });
      suitFetch().then((res) => {
        if (res.Result.Code === 0) {
          suitArr.value = res.Result.Content;
        }
      });
    }
  },
  onConfirm() {
    const algCode = {} as any;
    const algSub = {} as any;
    for (const i in task.value.BaseAlgItemName) {
      for (const j in algArrs.value) {
        if (algArrs.value[j].name === task.value.BaseAlgItemName[i]) {
          algCode[algArrs.value[j].code] = true;
          if (algArrs.value[j].sub === true) {
            algSub[algArrs.value[j].item] = true;
          }
        }
      }
    }
    task.value.UserData.MethodConfig = [];
    for (const n in algSub) {
      task.value.UserData.MethodConfig.push(Number.parseInt(n));
    }

    task.value.AlgInfo = [];

    for (const n in algCode) {
      task.value.AlgInfo.push(Number.parseInt(n));
    }
    if (
      enableSuite.value &&
      (!task.value.UserData.suit_array ||
        task.value.UserData.suit_array.length === 0)
    ) {
      message.warning('请选择工装库');
      return;
    }
    for (const req of param_required) {
      switch (req.type) {
        case 0:
        case 2: {
          task.value.UserData[req.key] =
            req.type === 0
              ? Number.parseInt(param_val.value[req.key])
              : Number.parseFloat(param_val.value[req.key]);
          if (req.min !== req.max) {
            if (task.value.UserData[req.key] > req.max) {
              message.warning(`[${req.name}]最大值${req.max}`);
              return;
            }
            if (task.value.UserData[req.key] < req.min) {
              message.warning(`[${req.name}]最小值${req.min}`);
              return;
            }
          }
          break;
        }
        case 1: {
          task.value.UserData[req.key] = param_val.value[req.key];

          break;
        }
        case 4: {
          task.value.UserData[req.key] = param_val.value[req.key];

          break;
        }
        case 5: {
          task.value.UserData[req.key] = param_val.value[req.key];

          break;
        }
      }
      if (
        req.required &&
        (!param_val.value[req.key] || param_val.value[req.key].length === 0)
      ) {
        message.warning(`${req.name}必填`);
        return;
      }
    }

    if (enableCrowd.value) {
      task.value.UserData.crowd_level_lower = crowd_level.value[0];
      task.value.UserData.crowd_level_high = crowd_level.value[1];
    }

    taskConfig(task.value).then((res) => {
      if (res.Result.Code === 0) {
        modalApi.close();
        emit('confirm');
        message.success({
          content: res.Result.Desc,
        });
      }
    });
  },
  onClosed() {
    task.value = {};
    enableSuite.value = false;
    enableCrowd.value = false;
    enableCrowd.value = false;
    param_val.value = {};
    param_vec.length = 0;
    param_required.length = 0;
    selector_opts.length = 0;
  },
});
</script>

<template>
  <Modal title="任务信息">
    <Form
      :label-col="{ style: { width: '150px' } }"
      :wrapper-col="{ xs: 18, sm: 18, md: 18, lg: 20 }"
      label-align="right"
    >
      <Row>
        <Divider><b>基本信息</b></Divider>
        <Col span="12">
          <FormItem label="任务标识" name="AlgTaskSession">
            <Input v-model:value="task.AlgTaskSession" />
          </FormItem>
        </Col>
        <Col span="12">
          <FormItem label="任务描述" name="TaskDesc">
            <Input v-model:value="task.TaskDesc" />
          </FormItem>
        </Col>
        <Col span="12">
          <FormItem label="识别通道" name="MediaName">
            <Select v-model:value="task.MediaName" show-search>
              <template v-for="item in mediaArr" :key="item.MediaName">
                <SelectOption v-model:value="item.MediaName">
                  {{ item.MediaName }}
                  <span style="color: #8492a6; font-size: 13px">
                    - {{ item.MediaUrl }}
                  </span>
                </SelectOption>
              </template>
            </Select>
          </FormItem>
        </Col>
        <Col span="12">
          <FormItem label="计划模板" name="ScheduleId">
            <Select v-model:value="task.ScheduleId" show-search>
              <template v-for="item in scheduleArr" :key="item.Id">
                <SelectOption v-model:value="item.Id">
                  {{ item.Name }}
                </SelectOption>
              </template>
            </Select>
          </FormItem>
        </Col>
        <Col span="12">
          <FormItem label="上报地址" name="MetadataUrl">
            <Input v-model:value="task.MetadataUrl" />
          </FormItem>
        </Col>
        <Col span="12">
          <FormItem label="国标通道编号" name="GB28181Channel">
            <Input v-model:value="task.GB28181Channel" />
          </FormItem>
        </Col>
        <Col
          v-if="appContext.app.config.globalProperties.$ioOptions.length > 0"
          span="12"
        >
          <FormItem label="Io口信号输出" name="IoDevice">
            <Select v-model:value="task.IoDevice">
              <SelectOption
                v-for="item in appContext.app.config.globalProperties
                  .$ioOptions"
                :key="item.device"
                :value="item.device"
              >
                {{ item.description }}
                <span style="color: #8492a6; font-size: 13px">
                  - {{ item.name }}
                </span>
              </SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col
          v-if="
            appContext.app.config.globalProperties.$modbusOptions.length > 0
          "
          span="12"
        >
          <FormItem label="ModBus输出" name="ModBusDevice">
            <Select v-model:value="task.ModBusDevice">
              <SelectOption
                v-for="item in appContext.app.config.globalProperties
                  .$modbusOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.desc }}
              </SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Divider><b>算法配置</b></Divider>
        <Col span="24">
          <CheckboxGroup
            v-model:value="task.BaseAlgItemName"
            style="padding: 0 40px"
            @change="changeAlgos"
          >
            <Row>
              <Col :span="24">
                <Divider orientation="left">
                  <span style="color: #bfcbd9">已授权，可完整使用</span>
                </Divider>
              </Col>
              <template v-for="item in algArrs" :key="item.desc">
                <Col
                  v-if="item.permitted"
                  :lg="8"
                  :md="12"
                  :sm="12"
                  :xl="4"
                  :xs="12"
                  style="padding: 8px 3px"
                >
                  <Checkbox :value="item.desc">
                    {{ item.desc }}
                  </Checkbox>
                </Col>
              </template>
              <Col :span="24">
                <Divider orientation="left">
                  <span style="color: #bfcbd9">未授权，可体验使用</span>
                </Divider>
              </Col>
              <template v-for="item in algArrs" :key="item.desc">
                <Col
                  v-if="!item.permitted"
                  :lg="8"
                  :md="12"
                  :sm="12"
                  :xl="4"
                  :xs="12"
                  style="padding: 8px 3px"
                >
                  <Checkbox :value="item.desc">
                    {{ item.desc }}
                  </Checkbox>
                </Col>
              </template>
            </Row>
          </CheckboxGroup>
        </Col>
      </Row>
    </Form>

    <Form
      :label-col="{ span: 10 }"
      :wrapper-col="{ span: 14 }"
      label-align="right"
    >
      <Row>
        <Divider v-if="param_vec.length > 0"><b>参数配置</b></Divider>
        <Col v-if="param_vec.length > 0" span="24">
          <div
            v-for="params_array in param_vec"
            :key="params_array.algo"
            style="margin-top: 32px"
          >
            <Divider orientation="left">
              {{ params_array.algo }}
            </Divider>
            <div style="width: 100%; color: #606266">
              <Row :gutter="16" style="width: 100%">
                <Col
                  v-for="obj in params_array.params"
                  :key="obj.key"
                  :span="8"
                >
                  <FormItem :label="obj.name">
                    <Input
                      v-if="obj.type <= 1 || obj.type === 0"
                      v-model:value="param_val[obj.key]"
                      :label="obj.name"
                      :placeholder="obj.placeholder"
                      style="margin-bottom: 16px"
                    />
                    <Input
                      v-if="obj.type === 2"
                      v-model:value="param_val[obj.key]"
                      :placeholder="obj.placeholder"
                      style="margin-bottom: 16px"
                      @change="changeFloat(param_val[obj.key], obj.key)"
                    />
                    <Checkbox
                      v-if="obj.type === 4"
                      v-model:checked="param_val[obj.key]"
                      size="small"
                    />
                    <Select
                      v-if="obj.type === 5"
                      v-model:value="param_val[obj.key]"
                      :placeholder="obj.name"
                      style="
                        font-size: 13px;
                        width: 100%;
                        color: #909399;
                        border: #1a6ba7;
                      "
                    >
                      <SelectOption
                        v-for="item in selector_opts[obj.key]"
                        :key="item.key"
                        :disabled="!item.enable"
                        :label="item.name"
                        :value="item.value"
                      />
                    </Select>
                  </FormItem>
                </Col>
              </Row>
            </div>
          </div>
          <!-- 工装设置 -->

          <div v-if="enableSuite">
            <FormItem
              label="工服配置"
              style="font-weight: bold; margin-top: 10px"
            >
              <Select
                v-model:value="task.UserData.suit_array"
                multiple
                style="width: 100%"
              >
                <SelectOption
                  v-for="item in suitArr"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
          </div>
          <div v-if="enableCrowd" style="width: 100%">
            <FormItem label="拥挤度">
              <div style="width: 100%">
                <Slider
                  v-model:value="crowd_level"
                  :format-tooltip="show_crowd_tips"
                  :marks="marks"
                  :max="100"
                  :min="1"
                  :open-delay="1000"
                  range
                  show-stops
                  @change="on_crowd_changed"
                />
              </div>
            </FormItem>
          </div>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>

<style scoped></style>
