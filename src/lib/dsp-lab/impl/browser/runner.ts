import { BrowserAudioNodeFactory, GetAudioNodeOptions } from ".";
import { IIDGenerator, IIDGenerator_impl, incrementIDGeneratorFactory } from "../../../common/id";
import { IAudioNode, IAudioNodeGraph, IAudioNodeGraphRunner, IAudioNodeGraphRunner_partial_impl } from "../../interface";

export interface BrowserAudioNodeGraphRunner extends IAudioNodeGraphRunner {
  /** 获取当前使用的节点图。
   * 
   * 注意：不要对返回值进行更改，否则可能会导致实际运行的效果与节点图不一致。 */
  get_audio_context(): AudioContext
  set_audio_context_options(audio_context_options: AudioContextOptions): void
  /** 利用当前容器的资源创建节点。 */
  create_node<T extends BrowserAudioNodeFactory<any, any, any>>(factory: T, options?: GetAudioNodeOptions<T>): IAudioNode | false
  /** 设置 `AudioContext` 的参数。在下一次调用 `install_node_graph` 的时候会被使用。 */
}

/** `BrowserAudioNodeGraphRunner` 的实现。默认使用 `incrementIDGeneratorFactory` 生成 id。
 * 
 */
export function BrowserAudioNodeGraphRunner_impl(audio_context_options?: AudioContextOptions): BrowserAudioNodeGraphRunner {
  const partial_impl = IAudioNodeGraphRunner_partial_impl()
  let audio_context = new AudioContext(audio_context_options)
  return {
    ...partial_impl,
    async install_node_graph(node_graph) {
      await audio_context.close()
      audio_context = new AudioContext(audio_context_options)
      partial_impl.set_node_graph(node_graph)
    },
    get_audio_context() {
      return audio_context
    },
    set_audio_context_options(options) {
      audio_context_options = options
    },
    create_node(factory, options) {
      const node_graph = partial_impl.get_node_graph()
      if (node_graph === undefined) return false
      let id: ReturnType<IIDGenerator["generate_next_id"]>
      do {
        id = partial_impl.get_id_generator().generate_next_id()
        if (id === false) return false
      } while (node_graph.has_entity(id))
      const node = factory(audio_context, id, options ?? {})
      node_graph.set_entity(node)
      return node
    },
  }
}