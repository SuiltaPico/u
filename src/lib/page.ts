import Tag, { RawTag, RawTag_to_Tag } from "./tag";

export default interface Page {
  name: string;
  path: string;
  compo_path: string;
  tags: Tag[];
  alias: string[] | string | undefined;
  hide: boolean;
}

export interface RawPage {
  name: string;
  path?: string;
  compo_path?: string;
  /** 标签 */
  tags?: RawTag | RawTag[];
  /** 路径别名 */
  alias?: string[] | string;
  /** 隐藏展示 */
  hide?: boolean;
}

export function RawPage_to_Page(rp: RawPage): Page {
  const path = rp.path ?? rp.name;
  const raw_tags = rp.tags
    ? Array.isArray(rp.tags)
      ? rp.tags
      : [rp.tags]
    : [];
  return {
    ...rp,
    path: "/" + path,
    compo_path: rp.compo_path ?? path,
    hide: rp.hide ?? false,
    alias: rp.alias,
    tags: raw_tags.map((v) => RawTag_to_Tag(v)),
  };
}
