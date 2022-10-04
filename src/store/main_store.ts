import { defineStore } from "pinia";

const use_main_store = defineStore("main_store", {
  state: () => {
    return {
      left_bar_showing: false,
      index_loading: false,
    };
  },
  actions: {
    toggle_left_bar(value?: boolean) {
      if (value !== undefined) {
        this.left_bar_showing = value;
      } else {
        this.left_bar_showing = !this.left_bar_showing;
      }
    },
    set_index_loading(value: boolean) {
      this.index_loading = value;
    },
  },
});

export default use_main_store;
