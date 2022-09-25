import Page from "./page";

export default interface Tag {
  name: string;
}

export type RawTag = string | Tag;

export function RawTag_to_Tag(rt: RawTag): Tag {
  if (typeof rt === "string") {
    return { name: rt };
  }
  return rt;
}

export interface TagTreeBranch {
  type: "branch"
  name: string;
  children: (TagTreeLeaf | TagTreeBranch)[];
}

export interface TagTreeLeaf {
  type: "leaf"
  name: string;
  children: Page[];
}