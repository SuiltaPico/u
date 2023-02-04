import { ICloneable, clone } from "./clone";
import { ID, IIDGenerator } from "./id";
import { ISerializable } from "./serialize";

/** 实体，定义为具有 `id` 的类对象 */
export interface IEntity {
  id: ID;
}

export function IEntity_impl(id: ID) {
  return { id };
}

export function IEntity_impl_by_IIDGenerator(id_generator: IIDGenerator) {
  return { id: id_generator.generate_next_id() };
}

/** 实体的管理器。 */
export interface IEntityManager<Entity extends IEntity>
  extends ISerializable<IEntityManagerSerialized<Entity>>, ICloneable {
  /** 设置实体。如果发生 ID 冲突会覆写之前的实体。 */
  set_entity(entity: Entity): void;
  /** 设置实体。如果发生 ID 会返回 false */
  safely_set_entity(entity: Entity): boolean;
  /** 判断实体是否存在。 */
  has_entity(entity_id: ID): boolean;
  /** 获取实体。 */
  get_entity(entity_id: ID): Entity | undefined;
  /** 删除实体。 */
  delete_entity(entity_id: ID): boolean;
  /** 获取所有实体。 */
  get_all_entities(): Entity[];
  /** 获取实体的迭代器。 */
  get_entities_iter(): Iterator<Entity>;
  /** 清除所有实体的储存。 */
  clear_entities_store(): void;
}

export interface IEntityManagerSerialized<Entity extends IEntity> {
  entities_record: Record<ID, Entity>;
}

/** 以 `Map` 实现的实体管理器的工厂函数。
 */
export function IEntityManager_impl<
  Entity extends IEntity
>(): IEntityManager<Entity> {
  const entity_map = new Map<ID, Entity>();
  const self = {
    set_entity(entity: Entity) {
      return entity_map.set(entity.id, entity);
    },
    safely_set_entity(entity: Entity) {
      if (entity_map.has(entity.id)) {
        return false
      }
      entity_map.set(entity.id, entity)
      return true
    },
    has_entity(entity_id: ID) {
      return entity_map.has(entity_id);
    },
    get_entity(entity_id: ID) {
      return entity_map.get(entity_id);
    },
    delete_entity(entity_id: ID) {
      return entity_map.delete(entity_id);
    },
    get_all_entities() {
      return [...entity_map.values()];
    },
    get_entities_iter() {
      return entity_map.values();
    },
    clear_entities_store() {
      return entity_map.clear();
    },
    toJSON() {
      return {
        entities_record: Object.fromEntries(entity_map),
      };
    },
    clone() {
      const result = IEntityManager_impl<Entity>()
      for (const entity of self.get_entities_iter())
        result.set_entity(clone(entity))
      return result
    },
  };
  return self
}
