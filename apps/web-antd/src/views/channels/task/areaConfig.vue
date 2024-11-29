<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

const [Modal, modalApi] = useVbenModal({
  class: 'w-[60vw]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  fullscreen: true,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>().content;
      if (data) {
        console.log(data);
      }
    }
  },
  onConfirm() {},
  onClosed() {},
});
</script>

<template>
  <Modal title="任务信息"> 1 </Modal>
</template>

<style scoped></style>
