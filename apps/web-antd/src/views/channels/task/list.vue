<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { useVbenModal } from '@vben/common-ui';
import { AntdDownOut } from '@vben/icons';

import {
  Button,
  Divider,
  Dropdown,
  Menu,
  MenuDivider,
  MenuItem,
  message,
  Popconfirm,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { controlTask, taskDel } from '#/api';

import AreaConfigModal from './areaConfig.vue';
import DetailModal from './detail.vue';
import taskSchema from './task.schema';

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

const gridEvents: VxeGridListeners<RowType> = {};

const gridOptions: VxeGridProps<RowType> = {
  ...taskSchema,
};
const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

const [AreaModal, AreaModalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: AreaConfigModal,
});
const [Modal, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: DetailModal,
});
function openModal(row: any) {
  modalApi.setData({
    content: row,
  });
  modalApi.open();
}
function openConfigArea(row: any) {
  AreaModalApi.setData({
    content: row,
  });
  AreaModalApi.open();
}

function controlTaskStatus(row: any) {
  let taskStatus = row.AlgTaskStatus.type;
  taskStatus = taskStatus === 0 ? 1 : 0;
  controlTask({
    ControlCommand: taskStatus,
    AlgTaskSession: row.AlgTaskSession,
  }).then((res) => {
    if (res.Result.Code === 0) {
      message.success({
        content: res.Result.Desc,
      });
      gridApi.reload();
    }
  });
}
const delMediaFunc = (row: any) => {
  taskDel({ AlgTaskSession: row.AlgTaskSession }).then((res) => {
    if (res.Result.Code === 0) {
      message.success({
        content: res.Result.Desc,
      });
      gridApi.reload();
    }
  });
};
const addTask = () => {
  modalApi.setData({
    content: null,
  });
  modalApi.open();
};
</script>

<template>
  <div class="vp-raw h-[88vh] w-full">
    <Grid>
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="addTask"> 新增任务 </Button>
      </template>
      <template #AlgInfo="{ row }">
        <div v-for="(item, index) in row.BaseAlgItem" :key="index">
          {{ item.name }}
        </div>
      </template>
      <template #AlgTaskStatus="{ row }">
        <Tag
          v-if="row.AlgTaskStatus.type === 4"
          :color="row.AlgTaskStatus.style"
        >
          {{ row.AlgTaskStatus.label }}
        </Tag>
        <Tag
          v-else-if="
            row.AlgTaskStatus.type === 1 || row.AlgTaskStatus.type === 0
          "
          color="processing"
        >
          {{ row.AlgTaskStatus.label }}
        </Tag>
        <Tag v-else-if="row.AlgTaskStatus.type === 2" color="warning">
          {{ row.AlgTaskStatus.label }}
        </Tag>
        <Tag v-else-if="row.AlgTaskStatus.type === 3" color="error">
          {{ row.AlgTaskStatus.label }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openModal(row)"> 编辑 </Button>
        <Divider type="vertical" />
        <Button
          v-if="row.AlgTaskStatus.type === 0"
          size="small"
          type="link"
          @click="controlTaskStatus(row)"
        >
          启动
        </Button>
        <Button
          v-if="row.AlgTaskStatus.type !== 0"
          danger
          size="small"
          type="link"
          @click="controlTaskStatus(row)"
        >
          停止
        </Button>
        <Divider type="vertical" />
        <Dropdown size="small">
          <template #overlay>
            <Menu>
              <Popconfirm
                title="请确认是否删除数据"
                @confirm="delMediaFunc(row)"
              >
                <MenuItem key="1">删除</MenuItem>
              </Popconfirm>
              <MenuDivider />
              <MenuItem
                key="2"
                :disabled="row.AlgTaskStatus.type === 0"
                @click="openConfigArea"
              >
                配置区域
              </MenuItem>
            </Menu>
          </template>
          <Button size="small" type="link">
            <span>选项<AntdDownOut style="display: inline" /></span>
          </Button>
        </Dropdown>
      </template>
    </Grid>
    <Modal @confirm="gridApi.reload" />
    <AreaModal />
  </div>
</template>

<style scoped></style>
