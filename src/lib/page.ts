import Tag from "./tag";

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
  tags?: Tag[];
  alias?: string[] | string;
  hide?: boolean;
}

export function RawPage_to_Page(rp: RawPage): Page {
  const path = rp.path ?? rp.name;
  return {
    ...rp,
    path: "/" + path,
    compo_path: rp.compo_path ?? path,
    hide: rp.hide ?? false,
    alias: rp.alias,
    tags: rp.tags ?? []
  };
}
