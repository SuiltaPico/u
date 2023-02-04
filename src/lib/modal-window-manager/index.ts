import { type } from "os";
import { IEntityManager, IEntityManager_impl } from "../common/entity";
import {
  ID,
  IDGenerator,
  IIDGenerator,
  IIDGenerator_impl,
  incrementIDGeneratorFactory,
} from "../common/id";
import {
  IMutableTreeNode,
  ITreeGraph,
  ITreeGraph_impl,
} from "../math/node_and_graph";

export interface IModalWindow extends IMutableTreeNode {}
export type IDOrUndefined = IModalWindow | undefined;

export enum Direction {
  Row,
  Column,
}

type ModalWindowContainer = IModalWindow;

/** 窗口管理器。一维的窗口布局。基于Flexbox管理。 */
function create_ModalWindowContainer(
  manager: Readonly<ModalWindowManager>,
  options?: Readonly<{ direction?: Direction }>
) {
  const o = options ?? {};
  return {
    
  };
}


// export class ModalWindowContainer implements IModalWindow {
//   id: ID;
//   direction: Direction;
//   children: IDOrUndefined[] = [];

//   constructor(
//     manager: ModalWindowManager,
//     options?: { direction?: Direction }
//   ) {
//     this.id = manager.generate_next_id();
//     const op = options ?? {};
//     this.direction = op.direction ?? Direction.Row;
//   }

//   set_child(): boolean {
//     throw new Error("Method not implemented.");
//   }
//   delete_child(children_id: number): boolean {
//     throw new Error("Method not implemented.");
//   }
//   delete_child_by_index(index: number): boolean {
//     throw new Error("Method not implemented.");
//   }
//   get_children(): IDOrUndefined[] {
//     return this.children;
//   }
//   get_connected(): IModalWindow[] {
//     return ITreeNode_get_connected(this as ModalWindowContainer);
//   }
// }

/** @see `create_ModalWindowManager` */
export type ModalWindowManager = ITreeGraph<IModalWindow> & IIDGenerator;

/** 创建模态窗口管理器。
 * 
 * ### 模态窗口管理器
 * 管理模态窗口树。
 */
export function create_ModalWindowManager(): ModalWindowManager {
  return {
    ...IIDGenerator_impl(incrementIDGeneratorFactory()),
    ...ITreeGraph_impl<IModalWindow>(),
  };
}

