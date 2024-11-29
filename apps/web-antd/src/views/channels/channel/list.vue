<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { useVbenModal } from '@vben/common-ui';

import { Button, Divider, message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { mediaDel, mediaFetch } from '#/api';

import ExtraModal from './detail.vue';

interface RowType {
  MediaName: string;
  MediaDesc: number;
  MediaStatus: {
    label: string;
    style: string;
    type: number;
  };
  MediaUrl: string;
}
const getTableData = async () => {
  let tableData = [] as any;
  await mediaFetch().then((res) => {
    tableData = res.Content;
  });
  return new Promise<{ items: any; total: number }>((resolve) => {
    resolve({
      total: tableData.length,
      items: tableData,
    });
  });
};
const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { field: 'MediaName', title: '通道名称' },
    { field: 'MediaUrl', title: '通道地址' },
    { field: 'MediaDesc', title: '通道描述' },
    {
      field: 'MediaStatus',
      slots: { default: 'MediaStatus' },
      title: '通道状态',
    },
    { field: 'action', slots: { default: 'action' }, title: '操作' },
  ],
  exportConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getTableData();
      },
    },
  },
  keepSource: true,
  height: 'auto',
  scrollY: {
    enabled: true,
    gt: 0,
  },
  showOverflow: false,
  border: true,
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: true,
    // import: true,
    refresh: true,
    zoom: true,
  },
};

const gridEvents: VxeGridListeners<RowType> = {};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

const [Modal, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: ExtraModal,
});

function openModal(row: any) {
  modalApi.setData({
    content: row,
  });
  modalApi.open();
}

const delMediaFunc = (row: any) => {
  mediaDel({ MediaName: row.MediaName }).then((res) => {
    if (res.Result.Code === 0) {
      message.success({
        content: res.Result.Desc,
      });
      gridApi.reload();
    }
  });
};
</script>

<template>
  <div class="vp-raw h-[88vh] w-full">
    <Grid>
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="openModal(null)">
          新增通道
        </Button>
      </template>
      <template #MediaStatus="{ row }">
        <Tag v-if="row.MediaStatus.type === 4" :color="row.MediaStatus.style">
          {{ row.MediaStatus.label }}
        </Tag>
        <Tag v-else-if="row.MediaStatus.type === 1" color="processing">
          {{ row.MediaStatus.label }}
        </Tag>
        <Tag v-else-if="row.MediaStatus.type === 2" color="warning">
          {{ row.MediaStatus.label }}
        </Tag>
        <Tag v-else-if="row.MediaStatus.type === 3" color="error">
          {{ row.MediaStatus.label }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openModal(row)"> 编辑 </Button>
        <Divider type="vertical" />
        <Popconfirm title="请确认是否删除数据" @confirm="delMediaFunc(row)">
          <Button danger size="small" type="link"> 删除 </Button>
        </Popconfirm>
      </template>
    </Grid>
    <Modal @confirm="gridApi.reload()" />
  </div>
</template>

<style scoped></style>
