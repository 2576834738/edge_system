<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { useVbenModal } from '@vben/common-ui';

import { Button, Divider, Image, message, Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { alarmDel, alarmFetch } from '#/api';

import ExtraModal from './detail.vue';

const imageBaseUrl = `http://${window.location.host}/`;
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
const getTableData = async (data: any) => {
  let tableData = [] as any;
  let total = 0 as number;
  await alarmFetch(data).then((res) => {
    tableData = res.Content.Alarm;
    total = res.Content.AlarmCount;
  });
  return new Promise<{ items: any; total: number }>((resolve) => {
    resolve({
      total,
      items: tableData,
    });
  });
};
const delMediaFunc = (row) => {
  alarmDel({ MediaName: row.MediaName }).then((res) => {
    if (res.Result.Code === 0) {
      message.success({
        content: res.Result.Desc,
      });
    }
  });
};
const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    {
      field: 'ImageData',
      slots: { default: 'ImageData' },
      title: '告警图片',
    },
    { field: 'TaskSession', title: '任务编号' },
    {
      field: 'Media',
      slots: { default: 'Media' },
      title: '通道名称',
    },
    {
      field: 'Summary',
      slots: { default: 'Summary' },
      title: '告警类别',
    },
    {
      field: 'Upload',
      slots: { default: 'Upload' },
      title: '上报状态',
    },
    { field: 'Time', title: '告警时间' },

    { field: 'action', slots: { default: 'action' }, title: '操作' },
  ],
  exportConfig: {
    type: 'xlsx',
    async sheetMethod(params) {
      const { worksheet, workbook } = params;
      worksheet.eachRow((excelRow, rowIndex) => {
        if (rowIndex > 2) {
          // 设置行高
          excelRow.height = 60;
          excelRow.eachCell(async (excelCell, columnIndex) => {
            if (columnIndex === 2) {
              const response = await fetch(
                imageBaseUrl + excelCell.model.value,
              );
              const buffer1 = await response.arrayBuffer();
              const imageId1 = workbook.addImage({
                buffer: buffer1,
                extension: 'jpeg',
              });
              // 根据当前下标数据，获取图片
              worksheet.addImage(imageId1, {
                tl: { col: columnIndex, row: rowIndex },
                ext: { width: 40, height: 40 },
              });
            }
          });
        }
      });
    },
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getTableData({
          page: page.currentPage - 1,
          size: page.pageSize,
          task: null,
          channel: null,
          begin_time: null,
          end_time: null,
          type: null,
        });
      },
    },
  },
  pagerConfig: {
    total: 0,
    currentPage: 1,
    pageSize: 12,
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
</script>

<template>
  <div class="vp-raw h-[88vh] w-full">
    <Grid>
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="modalApi.open()">
          新增通道
        </Button>
      </template>
      <template #ImageData="{ row }">
        <img
          v-if="row.ImageDataLabeled && row.ImageData"
          :src="
            row.ImageDataLabeled
              ? imageBaseUrl + row.ImageDataLabeled
              : imageBaseUrl + row.ImageData
          "
        />
        <span v-else> 暂无图片 </span>
      </template>
      <template #Media="{ row }">
        {{ row.Media.MediaName }}
      </template>
      <template #Summary="{ row }">
        {{ row.Summary }}
      </template>
      <template #Upload="{ row }">
        <Tooltip placement="top">
          <Tag v-if="row.Upload.status === 1" color="warning">
            {{ row.Upload.reason }}
          </Tag>
          <Tag v-else-if="row.Upload.status === 2" color="error">
            {{ row.Upload.reason }}
          </Tag>
          <Tag v-else color="success">
            {{ row.Upload.reason }}
          </Tag>
        </Tooltip>
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openModal(row)"> 查看 </Button>
        <Divider type="vertical" />
        <Button danger size="small" type="link" @click="delMediaFunc(row)">
          删除
        </Button>
      </template>
    </Grid>
    <Modal />
  </div>
</template>

<style scoped></style>
