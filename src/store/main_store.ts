import { defineStore } from "pinia";

const use_main_store = defineStore("main_store", {
  state: () => {
    return {
      left_bar_showing: false,
    };
  },
  actions: {
    toggle_left_bar(value?: boolean) {
      if (value !== undefined) {
        this.left_bar_showing = value
      } else {
        this.left_bar_showing = !this.left_bar_showing;
      }
    },
  },
});

export default use_main_store;
