import { computed, ComputedRef, reactive, ref, Ref } from "vue";

export default class ProgressBar {
  tasks: RawTask[];
  computed_tasks: ComputedRef<Task[]>;
  /** 0 ~ 1 */
  progress: Ref<number>;
  constructor(init_progress?: number) {
    this.tasks = reactive([]);
    this.progress = ref(init_progress ?? 0);
    this.computed_tasks = computed(() => {
      const tasks = this.tasks;
      const tasks_len = this.tasks.length;

      const result = new Array(tasks_len).fill(
        undefined,
        0,
        tasks_len
      ) as Task[];

      const total_consumption = tasks.reduce((prev, curr) => {
        return prev + curr.consumption;
      }, 0);

      for (let i = 0; i < tasks_len; i++) {
        const task = tasks[i];
        result.push({
          name: task.name,
          description: task.description,
          consumption: task.consumption / total_consumption,
        });
      }
      return result;
    });
  }

  run(){

  }

  run_from_task(){
    
  }
}

export interface RawTask {
  name: string;
  description: string;
  consumption: number;
  observer_registration: (observer: ProgressBar) => void;
}

export interface Task {
  name: string;
  description: string;
  consumption: number;
}
