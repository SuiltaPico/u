/** 节点。*/
export interface INode {
  connect(node: INode): void;
  disconnect(node: INode): void;
}

/** 节点元信息。*/
export interface INodeMeta {
  input: number
  output: number
  channel_count: number
  /** 通道必须在节点的输入和输出之间匹配的方式。
   * * `max`：通道数等于所有连接的最大通道数。在这种情况下，`channel_count` 被忽略，只发生向上混音。
   * * `clamped-max`：通道数等于所有连接的最大通道数，然后收缩到 `channel_count` 的值。
   * * `explicit`：通道数为 `channel_count`。
  */
  channel_count_mode: ChannelCountMode
  /** 当输入/输出数量不同时输入通道如何映射到输出通道。 
   * * `speakers`: 将一组“标准”映射用于常见扬声器输入和输出设置（单声道、立体声、四声道、5.1）的组合。
   * 关于这组“标准”映射详见 https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#up-mixing_and_down-mixing
   * * `discrete`：输入通道按顺序映射到输出通道。 如果有更多的输入输出，则丢弃额外的输入； 如果少于未使用的输出则保持沉默。（十分摆烂的算法）
   */
  channel_interpretation: ChannelInterpretation
}


/** 节点图。*/
export interface INodeGraph {
  push(): void
  remove(): void
  get_nodes(): Set<INode>;
  get_input_node_meta(): INodeMeta
  get_destination_node_meta(): INodeMeta
}

/** 节点图运行器。实例化节点图。*/
export interface INodeGraphRunner {
  use_node_graph(node_graph: INodeGraph): void
}

export class AudioContextNodeGraph implements INodeGraph {

}

export class AudioContextNodeGraphRunner implements INodeGraphRunner {
  audio_context: AudioContext;
  nodes: Set<INode> = new Set();
  constructor(sample_rate: number) {
    this.audio_context = new AudioContext({
      sampleRate: sample_rate,
    });
  }
}
