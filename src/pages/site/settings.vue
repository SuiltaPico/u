<script setup lang="ts">
import use_main_store from '../../store/main_store';

const main_store = use_main_store()
</script>

<template lang="pug">
q-page.bg-white.flex.flex-col.gap-4.gap-10.min-w-100.max-w-100.px-2.py-8(
  class="md:min-w-75 md:max-w-75 xl:min-w-50 xl:max-w-50 xl:px-8"
  )
  .flex.flex-col
    q-btn(flat color="primary" to="vfsmgr") 虚拟文件系统管理
  
  .flex.flex-col

</template>