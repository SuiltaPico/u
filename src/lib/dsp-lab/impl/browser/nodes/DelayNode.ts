import { BrowserAudioNodeFactory } from "..";
import { IEntity_impl_by_IIDGenerator } from "../../../../common/entity";
import { IIDGenerator } from "../../../../common/id";
import { ISerializable } from "../../../../common/serialize";
import { IAudioNode, IAudioParam } from "../../../interface";
import {
  AudioNode_to_INodeMetaContainner_impl,
  AudioParam_to_IParam_impl,
} from "../utils";

export interface IDelayNode
  extends IAudioNode,
  ISerializable<IDelayNodeSerialized> {
  delay_time: IAudioParam;
}

export interface IDelayNodeOptions {
  /** 初始化延迟时间，默认是 0。 */
  initial_delay_time: number
  /** 最大延迟时间，默认是 1。 */
  max_delay_time: number
}

export interface IDelayNodeSerialized {
  node_type: "delay_node";
  delay_time: IAudioParam;
  options: Partial<IDelayNodeOptions>
}

export const create_DelayNode: BrowserAudioNodeFactory<IDelayNode, IDelayNodeOptions, IDelayNodeSerialized> = (ac, id, options) => {
  const audio_node = new DelayNode(ac, {
    delayTime: options.initial_delay_time ?? 0,
    maxDelayTime: options.max_delay_time ?? 1
  });
  const delay_time_param = AudioParam_to_IParam_impl(audio_node.delayTime, "a-rate")
  return {
    ...AudioNode_to_INodeMetaContainner_impl(audio_node),
    id,
    delay_time: delay_time_param,
    toJSON() {
      return {
        node_type: "delay_node",
        delay_time: delay_time_param,
        options,
      }
    },
  };
}

