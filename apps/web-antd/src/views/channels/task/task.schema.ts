import { taskFetch } from '#/api';

const getTableData = async () => {
  let tableData = [] as any;
  await taskFetch().then((res) => {
    tableData = res.Content;
  });
  return new Promise<{ items: any; total: number }>((resolve) => {
    resolve({
      total: tableData.length,
      items: tableData,
    });
  });
};

export default {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { field: 'AlgTaskSession', title: '任务编号' },
    { field: 'MediaName', title: '视频源' },
    { field: 'MetadataUrl', title: '上报地址' },
    {
      field: 'AlgInfo',
      slots: { default: 'AlgInfo' },
      title: '算法配置信息',
    },
    {
      field: 'AlgTaskStatus',
      slots: { default: 'AlgTaskStatus' },
      title: '通道状态',
    },

    {
      field: 'action',
      slots: { default: 'action' },
      title: '操作',
    },
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
