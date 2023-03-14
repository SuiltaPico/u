import Page, { RawPage, RawPage_to_Page } from "../lib/page";
import Tag, { TagTreeNode } from "../lib/tag";

const raw_tag_icon_map: {
  [tag_name: string]: string | { name: string; scaling: number };
} = {
  全部: "mdi-creation",
  最近访问: "mdi-history",
  文件: { name: "mdi-file-multiple", scaling: 0.85 },
  数学: "mdi-android-studio",
  随机: "mdi-dice-multiple-outline",
  数字信号处理: "mdi-waveform",
  未分组: "mdi-help-box",
  编码: "mdi-numeric-0-box-multiple",
};

export const tag_icon_map = (() => {
  const result: {
    [tag_name: string]: { name: string; scaling: number };
  } = {};
  Object.entries(raw_tag_icon_map).forEach(([name, value]) => {
    if (typeof value === "string") {
      result[name] = { name: value, scaling: 1 };
      return;
    }
    result[name] = value;
  });
  return result;
})();

export const tag_relations: [tag_name: string, parents: string | string[]][] = [
  ["PDF", "文档"],
  ["文档", "文件"],
  ["矩阵", "数学"],
  ["随机", "数学"],
  ["音频", "媒体"],
  ["采样率", "媒体"],
  ["数字信号处理", "数学"],
  ["重采样", ["数字信号处理", "媒体"]],
  ["OCR", "图像"],
  ["图像", "文件"],
  ["编码", ["文件", "数学"]],
  ["压缩", "文件"],
];

function tag_relation_to_mermaid() {
  let result = "graph TD\n";
  tag_relations.forEach(([tag_name, parents]) => {
    if (Array.isArray(parents)) {
      parents.forEach((parent) => {
        result += " ".repeat(4) + parent + " --> " + tag_name + "\n";
      });
    } else {
      const parent = parents;
      result += " ".repeat(4) + parent + " --> " + tag_name + "\n";
    }
  });
  return result;
}

console.log(tag_relation_to_mermaid());

const math_raw_pages: RawPage[] = [
  {
    name: "霍夫曼编码",
    path: "huffman_coding",
    compo_path: "math/huffman_coding",
    description: "对字符串进行霍夫曼编码和解码",
    tags: ["数学", "编码"],
  },
];

export const raw_pages: RawPage[] = [
  ...math_raw_pages,
  {
    name: "压缩/解压缩",
    path: "archive/",
    compo_path: "archive/index",
    description: "对文件进行压缩/解压缩，支持多种格式。",
    tags: ["压缩"]
  },
  // {
  //   name: "PDF 大纲制作",
  //   path: "pdf_outline_maker",
  //   description: "重新制作 PDF 文件的目录。",
  //   tags: ["PDF", "目录"],
  // },
  // {
  //   name: "文件浏览",
  //   path: "view_file",
  //   description: "方便手机用户预览一些文件。",
  //   tags: ["文件"],
  // },
  // {
  //   name: "矩阵工具",
  //   path: "matrix_tools",
  //   description: "临时的。",
  //   tags: ["数学", "矩阵"],
  // },
  {
    name: "改变采样率",
    path: "change_sample_rate",
    description: "支持多种算法重新改变音频文件的采样率。",
    tags: ["音频", "采样率", "重采样"],
  },
  // {
  //   name: "这个文件足够随机吗",
  //   path: "is_this_file_random_enough",
  //   description: "对文件随机程度的判断器。",
  //   tags: ["文件", "随机"],
  // },
  // {
  //   name: "OCR",
  //   path: "ocr",
  //   description: "ocr 文字识别",
  //   tags: ["OCR", "图像"],
  // },
  // {
  //   name: "DSP-Lab",
  //   path: "dsp-lab/index",
  //   description: "数字信号处理实验室（Web Audio API 实验室）",
  //   tags: ["数字信号处理"],
  // },
  {
    name: "有向图（关系）绘制器",
    path: "directed_graph_drawer",
    description: "可以用于快速绘制关系，链表",
    tags: ["数学"],
  },
  {
    name: "C语言类型解释",
    path: "c_type_declaration_explanation",
    compo_path: "pl/c_type_declaration_explanation",
    description: "通过自然语言解释C语言的类型声明。",
    tags: ["C语言", "类型"]
  }
  // {
  //   name: "快速文本格式化",
  //   path: "quick_text_fmt",
  //   description: "让文本快速格式化成你想要的样子。",
  // },
];

export const raw_pages_with_framework: RawPage[] = [
  {
    name: "首页",
    path: "index",
    alias: "/",
    compo_path: "site/index",
    hide: true,
  },
  {
    name: "设置",
    path: "settings",
    compo_path: "site/settings",
    hide: true,
  },
  {
    name: "关于",
    path: "about",
    compo_path: "site/about",
    hide: true,
  },
  {
    name: "虚拟文件系统管理",
    path: "vfsmgr/:full_path*",
    compo_path: "site/virtual_filesystem_manager",
    hide: true,
  },
  ...raw_pages,
  {
    name: "404",
    path: ":pathMatch(.*)",
    compo_path: "site/404",
    hide: true,
  },
];

export const pages: Page[] = raw_pages_with_framework.map((rp) =>
  RawPage_to_Page(rp)
);

export const unhidden_pages = pages.filter((p) => !p.hide);

/** tag 树，按照 `tag_relations` 先前指定的关系构建的树。如果子节点有多个父对象，那么父对象都包含这个子对象的同一份引用 */
export const tag_tree: TagTreeNode = {
  type: "node",
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

const tags = [...pages_tag_map.keys()];

// tag 单个子节点到父节点的映射
const tag_children_to_parents_map = new Map<string, string[]>();
for (const [name, parents] of tag_relations) {
  if (Array.isArray(parents)) {
    tag_children_to_parents_map.set(name, parents);
  } else {
    tag_children_to_parents_map.set(name, [parents]);
  }
}

const tag_parents_to_children_map = new Map<string, string[]>();
function push_to_tag_parents_map(parent: string, child: string) {
  let children = tag_parents_to_children_map.get(parent);
  if (children) {
    children.push(child);
  } else {
    tag_parents_to_children_map.set(parent, [child]);
  }
}
for (const [name, parents] of tag_relations) {
  if (Array.isArray(parents)) {
    for (const parent of parents) {
      push_to_tag_parents_map(parent, name);
    }
  } else {
    push_to_tag_parents_map(parents, name);
  }
}

const node_map = new Map<string, TagTreeNode>();

/** 构建 `parents_node` 为完整的树
 * @param page_set 属于当前 `parents_node` 的所有子页面。
 */
function build_tree(parents_node: TagTreeNode) {
  const children_pages = pages_tag_map.get(parents_node.name);
  if (children_pages) {
    for (const page of children_pages) {
      parents_node.children.push(page);
    }
  }

  const children_tags = tag_parents_to_children_map.get(parents_node.name);
  const children_tree_nodes = [];
  // 如果没有子节点，填充页面
  if (children_tags) {
    for (const tag of children_tags) {
      const tree_node_exist = node_map.has(tag);
      const tree_node: TagTreeNode = tree_node_exist
        ? node_map.get(tag)!
        : {
            type: "node",
            name: tag,
            children: [],
          };
      parents_node.children.push(tree_node);
      if (!tree_node_exist) {
        children_tree_nodes.push(tree_node);
        node_map.set(tag, tree_node);
      }
    }
  }

  for (const node of children_tree_nodes) {
    build_tree(node);
  }
}

tag_parents_to_children_map.set(
  "",
  tags.filter((r) => !tag_children_to_parents_map.has(r))
);

build_tree(tag_tree);

export interface RenderTagTreeNode {
  type: "node";
  name: string;
  node_children: RenderTagTreeNode[];
  page_children: Page[];
  /** 源节点的引用 */
  ref?: TagTreeNode;
  no_wrap?: true;
}

/** 将源标签树构建为每个页面只会出现一次的树
 * @param src 源标签树，不可以出现子节点引用父节点的情况
 */
function build_render_tag_tree(
  src: TagTreeNode,
  target: RenderTagTreeNode = {
    type: "node",
    name: "",
    node_children: [],
    page_children: [],
    ref: src,
  },
  pages_set: Set<Page> = new Set(),
  tag_tree_node_set: Set<TagTreeNode> = new Set()
) {
  const node_children = target.node_children;
  const page_children = target.page_children;

  let has_children = false;

  for (const child of src.children) {
    if (child.type === "page") {
      // if (pages_set.has(child)) continue;
      // pages_set.add(child);
      page_children.push(child);
      has_children = true;
      continue;
    }
    // 如果子节点未被渲染，则进入子节点渲染。如果已渲染，则停止深入。
    const render_node: RenderTagTreeNode = {
      type: "node",
      name: child.name,
      page_children: [],
      node_children: [],
      ref: child,
    };
    node_children.push(render_node);
    if (!tag_tree_node_set.has(child)) {
      build_render_tag_tree(child, render_node, pages_set, tag_tree_node_set);
    }
  }
  if (!has_children) {
    target.no_wrap = true;
  }
  return target;
}

function cut_tree_with_no_children(tree: RenderTagTreeNode) {
  if (tree.node_children.length === 0 && tree.page_children.length === 0)
    return true;
  let no_page = true;
  for (let index = 0; index < tree.node_children.length; index++) {
    const t = tree.node_children[index];
    if (!cut_tree_with_no_children(t)) no_page = false;
    else {
      tree.node_children.splice(index, 1);
      index--;
    }
  }
  if (no_page && tree.page_children.length === 0) return true;
  return false;
}

/** 合并处理过的标签树。所有页面只会出现一次。添加了“全部”标签，包含所有未隐藏的页面 */
export const render_tag_tree = (() => {
  const pre_render_tag_tree = build_render_tag_tree(tag_tree);
  cut_tree_with_no_children(pre_render_tag_tree);
  pre_render_tag_tree.node_children.splice(0, 0, {
    type: "node",
    name: "快速访问",
    node_children: [
      {
        type: "node",
        name: "全部",
        node_children: [],
        page_children: unhidden_pages,
        ref: tag_tree,
      },
      {
        type: "node",
        name: "最近访问",
        node_children: [],
        page_children: [],
      },
    ],
    page_children: [],
  });
  return pre_render_tag_tree;
})();

console.log(render_tag_tree);

/** 通过文本搜索页面，将遍历 tag 、页面标题和描述 */
export function search_pages(search_text: string) {
  if (!search_text) return [];
  const prompts = search_text
    .toLowerCase()
    .split(" ")
    .filter((s) => s.length !== 0);
  const result = new Set<Page>();
  // 从 tag 中搜索。O(n^2)
  for (const tag of tags) {
    let found = false;
    for (const prompt of prompts) {
      if (tag.indexOf(prompt) > -1) {
        found = true;
        break;
      }
    }
    if (found) {
      pages_tag_map.get(tag)!.forEach((p) => result.add(p));
    }
  }

  // 从 pages 中搜索
  for (const page of pages) {
    let found = false;
    for (const prompt of prompts) {
      if ([page.name, page.description].some((s) => s.indexOf(prompt) > -1)) {
        found = true;
        break;
      }
    }
    if (found) {
      result.add(page);
    }
  }

  return [...result.values()].filter((p) => !p.hide);
}
