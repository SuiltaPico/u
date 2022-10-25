import Page, { RawPage, RawPage_to_Page } from "../lib/page";
import Tag, { TagTreeBranch } from "../lib/tag";

export const raw_pages: RawPage[] = [
  {
    name: "首页",
    path: "index",
    alias: "/",
    hide: true,
  },
  {
    name: "PDF 大纲制作",
    path: "pdf_outline_maker",
    description: "重新制作 PDF 文件的目录。",
    tags: ["PDF"],
  },
  {
    name: "文件浏览",
    path: "view_file",
    description: "方便手机用户预览一些文件。",
  },
  {
    name: "矩阵工具",
    path: "matrix_tools",
    description: "临时的。",
    tags: ["数学"],
  },
  {
    name: "改变采样率",
    path: "change_sample_rate",
    description: "支持多种算法重新改变音频文件的采样率。",
    tags: ["音频"],
  },/** 
  {
    name: "Color Box Festival",
    path: "color_box_festival",
    tags: ["横版游戏"]
  }*/
];

export const pages: Page[] = raw_pages.map((rp) => RawPage_to_Page(rp));

export const pages_tree: TagTreeBranch = {
  type: "branch",
  name: "",
  children: [],
};

const pages_tag_map = new Map<string, Page[]>();
pages.forEach((p) => {
  if (p.hide) {
    return;
  }
  const push = (t: Tag) => {
    let tag_arr = pages_tag_map.get(t.name);
    if (tag_arr === undefined) {
      tag_arr = [p];
      pages_tag_map.set(t.name, tag_arr);
    } else {
      tag_arr.push(p);
    }
  };
  p.tags.forEach((t) => push(t));
  if (p.tags.length === 0) {
    push({ name: "未分组" });
  }
});

pages_tag_map.forEach((v, k) => {
  pages_tree.children.push({
    type: "leaf",
    name: k,
    children: v,
  });
});
