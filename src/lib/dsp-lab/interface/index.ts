import { IIDGenerator, IIDGenerator_impl, incrementIDGeneratorFactory } from "../../common/id";
import {
  INode,
  IRelationshipGraph,
  IRelationshipGraph_impl,
} from "../../math/node_and_graph";

/** 节点元信息。*/
export interface IAudioNodeMeta {
  /** 节点的输入数 */
  input: number;
  /** 节点的输出数 */
  output: number;
  /** 定义取决于 `INodeMeta.channel_count_mode`：
   * * `max`：忽略这个值。
   * * `clamped-max`：作为最大值。
   * * `explicit`：作为精确的通道数。
   */
  channel_count: number;
  /** 通道必须在节点的输入和输出之间匹配的方式。
   * * `max`：通道数等于所有连接的最大通道数。在这种情况下，`channel_count` 被忽略，只发生向上混音。
   * * `clamped-max`：通道数等于所有连接的最大通道数，然后收缩到 `channel_count` 的值。
   * * `explicit`：通道数为 `channel_count`。
   */
  channel_count_mode: ChannelCountMode;
  /** 当输入/输出数量不同时输入通道如何映射到输出通道。
   * * `speakers`: 将一组“标准”映射用于常见扬声器输入和输出设置（单声道、立体声、四声道、5.1）的组合。
   * 关于这组“标准”映射详见 https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#up-mixing_and_down-mixing
   * * `discrete`：输入通道按顺序映射到输出通道。 如果有更多的输入输出，则丢弃额外的输入； 如果少于未使用的输出则保持沉默。（十分摆烂的算法）
   */
  channel_interpretation: ChannelInterpretation;
}

export interface IAudioNodeMetaContainner {
  get_input(): IAudioNodeMeta["input"];
  get_output(): IAudioNodeMeta["output"];

  get_channel_count(): IAudioNodeMeta["channel_count"];
  set_channel_count(channel_count: IAudioNodeMeta["channel_count"]): void;

  get_channel_count_mode(): IAudioNodeMeta["channel_count_mode"];
  set_channel_count_mode(
    channel_count_mode: IAudioNodeMeta["channel_count_mode"]
  ): void;

  get_channel_interpretation(): IAudioNodeMeta["channel_interpretation"];
  set_channel_interpretation(
    channel_interpretation: IAudioNodeMeta["channel_interpretation"]
  ): void;
}

/** 节点。音频处理模块的通用接口。*/
export interface IAudioNode
  extends IAudioNodeMetaContainner,
  INode<IAudioNode> { }

/** 节点图。包含所有节点。管理关系。*/
export interface IAudioNodeGraph extends IRelationshipGraph<IAudioNode> { }

export function IAudioNodeGraph_impl() {
  IRelationshipGraph_impl();
}

/** 节点图运行器。用于实例化和管理节点图。*/
export interface IAudioNodeGraphRunner {
  /** 安装节点图。如果之前的节点图存在，则进行销毁处理。 */
  install_node_graph(node_graph: IAudioNodeGraph): void;
  /** 获取当前使用的节点图。 */
  get_node_graph(): IAudioNodeGraph | undefined;
  /** 仅设置节点图，不进行安装处理。*/
  set_node_graph(node_graph: IAudioNodeGraph): void;
  /** 设置 id 生成器。如果没有设置，将一直使用默认的 id 生成器。*/
  set_id_generator(id_generator: IIDGenerator): void;
  get_id_generator(): IIDGenerator;
}

/** 节点图运行器的部分实现。
 * ### 包含的实现
 * #### `IAudioNodeGraphRunner` 的函数
 * * `get_node_graph`
 * * `set_node_graph`
 * * `set_id_generator`
 * * `get_id_generator`
 */
export function IAudioNodeGraphRunner_partial_impl() {
  let curr_node_graph: IAudioNodeGraph | undefined
  let curr_id_generator: IIDGenerator = IIDGenerator_impl(incrementIDGeneratorFactory())
  return {
    get_node_graph() {
      return curr_node_graph
    },
    set_node_graph(node_graph) {
      curr_node_graph = node_graph
    },
    set_id_generator(id_generator) {
      curr_id_generator = id_generator
    },
    get_id_generator() {
      return curr_id_generator
    },
  } satisfies Partial<IAudioNodeGraphRunner>
}

/** 自动化率：
 * * `a-rate`：对每一个采样 都可以精细地更改和获取值。
 * * `k-rate`：对一个音频块只能采取同一个值和获取同一个值
 */
export type AutomationRate = "a-rate" | "k-rate";

/** 一个音频相关的参数。
 *
 * 一个 IParam 可以设置为特定值或值的变化，并且可以安排在特定时间发生并遵循特定模式。
 *
 * 每个 IParam 有一个事件列表，最初为空，用于定义值何时以及如何更改。
 * 当此列表不为空时，使用 IParam.value 属性被忽略。
 * 这个事件列表允许我们使用任意基于时间轴的自动化曲线来安排必须在非常精确的时间发生的更改。
 */
export interface IAudioValueMeta {
  /** 创建参数的初始值。 */
  default_value: number;
  /** 参数有效范围的最大可能值。 */
  max_value: number;
  /** 参数有效范围的最小可能值。 */
  min_value: number;
}

export interface IAudioParam {
  get_value_meta(): IAudioValueMeta;
  get_value(): number;
  get_automation_rate(): AutomationRate;
  /** 计划在精确的时间对 `IParam` 的值进行即时更改。 */
  set_value_at_time(value: number, start_time: number): void;
  /** 从上一个事件指定的时间开始，将值线性渐变到 `value` 参数中给定的新值，并在 `end_time` 参数的给定时间达到新值。 */
  linear_ramp_to_value_at_time(value: number, end_time: number): void;
  /** 从上一个事件指定的时间开始，遵循线性渐变到 `value` 参数中给定的新值，并在 `end_time` 参数的给定时间达到新值。 */
  exponential_ramp_to_value_at_time(value: number, end_time: number): void;
  /** 在 `startTime` 的时候以 `time_constant` 给定的速率开始，以指数方式接近目标值。适合用作ADSR的D和R。 */
  set_target_at_time(
    target: number,
    start_time: number,
    time_constant: number
  ): void;
  /** 从 `startTime` 开始，以 `values` 的曲线控制值的变化。 */
  set_value_curve_at_time(
    values: Float32Array,
    start_time: number,
    duration: number
  ): void;
  /** 取消 `start_time` 之后的所有计划的未来更改。 */
  cancel_scheduled_values(start_time: number): void;
}

// export interface IAudioParamSerialized {}
