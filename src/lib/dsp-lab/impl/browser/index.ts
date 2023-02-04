import { ID, IIDGenerator } from "../../../common/id";
import { ISerializable } from "../../../common/serialize";
import { IAudioNode } from "../../interface";
import { create_DelayNode } from "./nodes/DelayNode";

export type BrowserAudioNodeFactory<Node extends IAudioNode, Options extends object, Serialized> = (ac: AudioContext, id_generator: ID, options: Partial<Options>) => Node
export type GetAudioNodeOptions<T> = T extends BrowserAudioNodeFactory<any, infer Options, any> ? Options : never

export const node_factory_map = {
  "delay": create_DelayNode
} as const satisfies Record<string, BrowserAudioNodeFactory<IAudioNode, {}, any>>

