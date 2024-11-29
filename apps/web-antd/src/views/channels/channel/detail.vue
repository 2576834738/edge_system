<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Input, message, Select, SelectOption } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { mediaConfig, probeType } from '#/api';

import ExtraModal from './mediaInfo.vue';

const emit = defineEmits('confirm');
const mediaPropeTypeArr = reactive([] as any);
const oldPropeType = ref('');
const pageNoFlag = ref(false);

const [BaseForm, formApi] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  showDefaultActions: false,
  // 提交函数
  handleSubmit: onSubmit,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: [
    {
      component: 'Select',
      // 字段名
      fieldName: 'ProtocolType',
      // 界面显示的label
      label: '探测协议',
    },
    {
      component: 'Input',
      // 字段名
      fieldName: 'MediaUrl',
      // 界面显示的label
      label: '通道地址',
    },
    {
      component: 'Input',
      // 字段名
      fieldName: 'MediaName',
      // 界面显示的label
      label: '通道名称',
    },
    {
      component: 'Input',
      // 字段名
      fieldName: 'MediaDesc',
      // 界面显示的label
      label: '通道描述',
    },
    {
      component: 'Checkbox',
      // 字段名
      fieldName: 'RtspTransport',
      // 界面显示的label
      label: 'RTSP本地代理',
    },
    {
      component: 'Checkbox',
      // 字段名
      fieldName: 'GBTransport',
      // 界面显示的label
      label: '转发到国标服务',
    },
    {
      component: 'Input',
      // 字段名
      fieldName: 'SubId',
      dependencies: {
        if(values) {
          return !!values.GBTransport;
        },
        // 随意一个字段改变时，都会触发
        triggerFields: ['GBTransport'],
      },
      // 界面显示的label
      label: '国标通道',
    },
  ],
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  // 连接抽离的组件
  connectedComponent: ExtraModal,
});
const [Modal, modalApi] = useVbenModal({
  class: 'w-[50vw]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>().content;
      if (data) {
        const scheme = mediaPropeTypeArr[data.ProtocolType].scheme;
        formApi.setValues({
          MediaUrl: data.MediaUrl,
          ProtocolType: scheme,
          MediaName: data.MediaName,
          MediaDesc: data.MediaDesc,
          RtspTransport: data.RtspTransport,
          GBTransport: data.GBTransport,
          SubId: data.SubId,
        });
      }
    }
  },
  onConfirm() {
    formApi.getValues().then((res) => {
      mediaConfig(res).then((res) => {
        if (res.Result.Code === 0) {
          modalApi.close();
          message.success({
            content: res.Result.Desc,
          });
          emit('confirm');
        }
      });
    });
  },
});
onMounted(async () => {
  mediaPropeTypeArr.length = 0;
  await probeType().then((res) => {
    mediaPropeTypeArr.push(...res.Content);
  });
});
function mediaTypeChanged(value: any) {
  pageNoFlag.value = false;
  if (oldPropeType.value !== value) {
    const oldItem = mediaPropeTypeArr.find((item: any) => {
      return item.scheme === oldPropeType.value;
    });
    if (oldItem && oldItem.fields.length > 0) {
      formApi.setState((prev) => {
        const currentSchema = prev?.schema ?? [];
        const newSchema = [] as any;
        currentSchema.forEach((item: any) => {
          if (
            !oldItem.fields.some((field: any) => {
              return field.key === item.fieldName;
            })
          ) {
            newSchema.push(item);
          }
        });
        return {
          schema: [...newSchema],
        };
      });
    }
  }
  const item = mediaPropeTypeArr.find((item: any) => {
    return item.scheme === value;
  });
  oldPropeType.value = value;
  formApi.setFieldValue('ProtocolType', value);
  if (item.fields.length > 0) {
    formApi.setState((prev) => {
      const currentSchema = prev?.schema ?? [];
      const newSchema = [] as any;
      item.fields.forEach((item: any) => {
        if (item.key === 'PageNo') {
          pageNoFlag.value = true;
        } else {
          newSchema.push({
            component: 'Input',
            fieldName: item.key,
            label: item.name,
            componentProps: {
              placeholder: item.placeholder,
            },
            defaultValue: item.default,
          });
        }
      });
      return {
        schema: [...currentSchema, ...newSchema],
      };
    });
  }
}

function onSubmit(values: Record<string, any>) {
  message.success({
    content: `form values: ${JSON.stringify(values)}`,
  });
}
function selectMediaInfo(row: any) {
  formApi.setFieldValue('MediaUrl', row.value);
}

async function handleSearch() {
  if (pageNoFlag.value) {
    await formApi.getValues().then((res) => {
      drawerApi.setData({
        content: res,
      });
      drawerApi.open();
    });
  }
}
</script>

<template>
  <Modal title="通道信息">
    <BaseForm>
      <template #ProtocolType="slotProps">
        <Select
          v-model:value="slotProps.value"
          allow-clear
          placeholder="请选择探测协议"
          style="width: 100%"
          @change="mediaTypeChanged"
        >
          <SelectOption
            v-for="item in mediaPropeTypeArr"
            :key="item.scheme"
            :value="item.scheme"
          >
            {{ item.scheme.toUpperCase() }}
            <span style="color: #8492a6; font-size: 13px">
              - {{ item.description }}
            </span>
          </SelectOption>
        </Select>
      </template>
      <template #MediaUrl="slotProps">
        <Input
          v-model:value="slotProps.value"
          placeholder="请输入通道地址"
          style="width: 100%"
          @focus="handleSearch"
        />
      </template>
    </BaseForm>
    <Drawer @select-row="selectMediaInfo" />
  </Modal>
</template>

<style scoped></style>
