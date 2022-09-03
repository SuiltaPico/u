export default interface Tag {
  name: string;
}

export interface TagType {
  name: string;
  tags: (Tag | TagType)[];
}