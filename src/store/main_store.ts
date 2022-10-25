import { defineStore } from "pinia";
import { reactive, ref, toRef } from "vue";

const use_main_store = defineStore("main_store", () => {
  function toggle_template<
    K extends keyof T,
    T extends Record<any, any> & { [_ in K]: boolean }
  >(target: T, key: K) {
    return (value?: boolean) => {
      if (value !== undefined) {
        (target[key] as boolean) = value;
      } else {
        (target[key] as boolean) = !target[key];
      }
    };
  }

  const framework_showing = reactive({
    left_bar: false,
    header_bar: false,
    loading: false,
  });

  const title = ref("");

  return {
    left_bar_showing: toRef(framework_showing, "left_bar"),
    toggle_left_bar: toggle_template(framework_showing, "left_bar"),

    header_bar_showing: toRef(framework_showing, "header_bar"),
    toggle_header_bar: toggle_template(framework_showing, "header_bar"),

    framwork_loading: toRef(framework_showing, "loading"),
    toggle_framwork_loading: toggle_template(framework_showing, "loading"),

    title,
    set_title(value: string) {
      title.value = value;
      document.title = (value ? value : "未知页面")  + "- Sutils";
    },
  };
});

export default use_main_store;
