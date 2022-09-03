import Page, { RawPage, RawPage_to_Page } from "../lib/page";
import Tag, { TagType } from "../lib/tag";

export const tag_tree: TagType[] = [];

export const raw_pages: RawPage[] = [
  {
    name: "首页",
    path: "index",
    alias: "/",
  },
  {
    name: "PDF 大纲制作",
    path: "pdf_outline_maker",
    tags: [
      {
        name: "pdf",
      },
    ],
  },
];

export const pages: Page[] = raw_pages.map((rp) => RawPage_to_Page(rp));
