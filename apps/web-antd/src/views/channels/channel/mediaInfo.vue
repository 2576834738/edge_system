<script setup lang="ts">
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  useVbenVxeGrid,
  type VxeGridListeners,
  type VxeGridProps,
} from '#/adapter/vxe-table';
import { probeMedia } from '#/api';

const emit = defineEmits('selectRow');
const condition = ref({
  PageNo: 1,
  scheme: '',
});
const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[50vw]',
  showConfirmButton: false,
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = drawerApi.getData<Record<string, any>>().content;
      if (data) {
        condition.value = {
          PageNo: 1,
          scheme: '',
          ...data,
        };
        condition.value.scheme = data.ProtocolType;
      }
    }
  },
});

const getTableData = async () => {
  let tableData = [] as any;
  let total = 0 as number;
  await probeMedia(condition.value).then((res) => {
    tableData = res.Result.Content.List;
    total = res.Result.Content.List.Total;
  });
  return new Promise<{ items: any; total: number }>((resolve) => {
    resolve({
      total,
      items: tableData,
    });
  });
};
const gridOptions: VxeGridProps<any> = {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { field: 'name', title: '相机编号' },
    { field: 'value', title: '视频地址' },
  ],
  rowConfig: {
    isCurrent: true,
    isHover: true,
    currentMethod: ({ row }) => {
      emit('selectRow', row);
      return true;
    },
  },
  exportConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getTableData();
      },
    },
  },
  keepSource: true,
  scrollY: {
    enabled: true,
    gt: 0,
  },
  showOverflow: false,
  border: true,
  stripe: true,
};

const gridEvents: VxeGridListeners<any> = {};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });
</script>

<template>
  <Drawer title="请选择视频源">
    <Grid />
  </Drawer>
</template>

<style scoped></style>
