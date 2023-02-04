import { ICloneable, clone } from "../common/clone";
import {
  IEntity,
  IEntityManager,
  IEntityManagerSerialized,
  IEntityManager_impl,
} from "../common/entity";
import { ID } from "../common/id";
import RelationMap, { IRelationMapSerialized } from "../common/relation_map";
import { ExcludeISerializable, ISerializable } from "../common/serialize";
import { ExcludeKeyFrom } from "../common/types_utils";
import { create_setter_getter } from "../common/utils";

type INodeINode = INode<INodeINode>;

/** 节点接口。可以从节点访问其所有已连接的节点。
 *
 * @template Children 所连接的节点类型。默认情况下是子节点的类型是嵌套的 `INode`，即 `Children = INode<INode<INode<...>>>` */
export interface INode<Children = INodeINode> extends IEntity {
  /** 获取节点所连接的所有子项目的集合。 */
  // get_connected(): Readonly<Children[]>;
}

type ITreeNodeITreeNode = ITreeNode<ITreeNodeITreeNode>;

/** 树节点接口。具有有序的连接节点线性表。在连接节点线性表中允许 `undefined` 的出现。
 *
 * @template Children 子项目的类型。默认情况下是子节点的类型是传染的，即 `Children = ITreeNode<ITreeNode<ITreeNode<...>>>` */
export interface ITreeNode<Children = ITreeNodeITreeNode>
  extends INode<Children> {
  /** 获取节点的子项目数组。 */
  get_children(): Readonly<(Children | undefined)[]>;
}

/** `ITreeNode` 的部分实现。
 * ### 包含的实现
 * * `ITreeNode` 自身的完全实现。
 * * `INode` 自身的完全实现。
 */
export function ITreeNode_partial_impl<Children>(
  children_array: (Children | undefined)[]
): ExcludeKeyFrom<ITreeNode<Children>, IEntity> {
  return {
    get_children() {
      return children_array;
    },
  };
}

export type ITreeNodeChildren<T> = T extends ITreeNode<infer Children>
  ? Children
  : never;

type IMutableTreeNodeIMutableTreeNode =
  IMutableTreeNode<IMutableTreeNodeIMutableTreeNode>;

/** 子节点数量可变的树节点接口。具有有序的连接节点线性表。
 * @param Children 子项目的类型。默认情况下是子节点的类型是传染的，即 `Children = INode<INode<INode<...>>>` */
export interface IMutableTreeNode<Child = IMutableTreeNodeIMutableTreeNode>
  extends ITreeNode<Child> {
  /** 添加子项目。 */
  add_child(child: Child): number;
  /** 设置子项目。`index` 的索引需要大于0。 */
  set_child(child: Child | undefined, index: number): boolean;
  /** 将当前位置的子项目移除，然后左移所有后面的节点。 */
  delete_child(child: Child): boolean;
  delete_child_by_index(index: number): boolean;
}

/** `IMutableTreeNode` 的部分实现。
 * ### 包含的实现
 * * `IMutableTreeNode` 自身的完全实现。
 * * `ITreeNode` 自身的完全实现。
 * * `INode` 自身的完全实现。
 */
export function IMutableTreeNode_partial_impl<Children>(
  children_array: (Children | undefined)[]
) {
  return {
    ...ITreeNode_partial_impl(children_array),
    add_child(children) {
      return children_array.push(children);
    },
    set_child(children, index) {
      if (index < 0) return false;
      children_array[index] = children;
      return true;
    },
    delete_child(child) {
      const child_index = children_array.indexOf(child);
      if (child_index === -1) return false;
      children_array.splice(child_index, 1);
      return true;
    },
    delete_child_by_index(index) {
      if (children_array[index] === undefined) return false;
      children_array.splice(index, 1);
      return true;
    },
  } as IMutableTreeNode<Children>;
}

/** 自由连接的节点 */
export interface IFreeNode extends INode {
  connect_node(): boolean;
  disconnect_node(): boolean;
}

/** 图，具有节点。 */
export interface IGraph<Node extends INode> extends IEntityManager<Node> { }

function IGraph_impl<Node extends INode>() {
  return IEntityManager_impl<Node>();
}

/** 树图，具有唯一的根节点。 */
export interface ITreeGraph<Node extends INode> extends IGraph<Node> {
  get_root_node(): ID | undefined;
  set_root_node(node_id: ID): boolean;
}

export function ITreeGraph_impl<Node extends INode>(): ITreeGraph<Node> {
  const sg = create_setter_getter<ID | undefined>(undefined);
  return {
    ...IGraph_impl(),
    get_root_node: sg.get,
    set_root_node(node_id: ID) {
      if (!this.has_entity(node_id)) return false;
      sg.set(node_id);
      return true;
    },
  };
}

/** 可以直接控制关系的图。 */
export interface IRelationshipGraph<Node extends INode>
  extends ExcludeISerializable<IGraph<Node>>,
  ISerializable<IRelationshipGraphSerialized<Node>>, ICloneable {
  connect_node(src_node: Node, target_node: Node): void;
  disconnect_node(src_node: Node, target_node: Node): void;
  has_relation(src_node: Node, target_node: Node): boolean;
  /** 获得节点连接了谁。如果节点不存在，则返回空数组。 */
  get_node_connected(src_node: Node): Node[] | undefined;
  /** 获得谁连接了节点 */
  get_node_connector(src_node: Node): Node[] | undefined;
}

export interface IRelationshipGraphSerialized<Node extends INode>
  extends IEntityManagerSerialized<Node>,
  IRelationMapSerialized<ID> { }

export function IRelationshipGraph_impl<Node extends INode>(options?: {
  entity_manager?: IEntityManager<Node>
  relation_map?: RelationMap<ID>
}): IRelationshipGraph<Node> {
  const entity_manager = options?.entity_manager ?? IEntityManager_impl<Node>();
  const relation_map = options?.relation_map ?? new RelationMap<ID>();
  return {
    ...entity_manager,
    clear_entities_store() {
      relation_map.clear();
    },
    connect_node(src_node, target_node) {
      relation_map.set(src_node.id, target_node.id);
    },
    delete_entity(node_id) {
      const has_entity = entity_manager.has_entity(node_id);
      if (!has_entity) return false;
      relation_map.delete_item(node_id);
      entity_manager.delete_entity(node_id);
      return true;
    },
    disconnect_node(src_node, target_node) {
      relation_map.delete(src_node.id, target_node.id);
    },
    get_node_connected(src_node) {
      if (!relation_map.has_item(src_node.id)) return [];
      return [...relation_map.get(src_node.id)![0].values()].map(
        (id) => entity_manager.get_entity(id)!
      );
    },
    get_node_connector(src_node) {
      if (!relation_map.has_item(src_node.id)) return [];
      return [...relation_map.get(src_node.id)![1].values()].map(
        (id) => entity_manager.get_entity(id)!
      );
    },
    has_relation(src_node, target_node) {
      return relation_map.has(src_node.id, target_node.id);
    },
    toJSON() {
      return {
        ...entity_manager.toJSON(),
        ...relation_map.toJSON(),
      };
    },
    clone() {
      return IRelationshipGraph_impl({
        entity_manager: clone(entity_manager),
        relation_map: clone(relation_map)
      })
    }
  };
}
