import localforage, { createInstance } from "localforage";

export type VirtualFileSystemAcceptableType =
  | ArrayBuffer
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array;

export enum MetaType {
  FileMeta,
  DirectoryMeta,
}

export interface DirMeta {
  type: MetaType.DirectoryMeta;
  name: string;
  files: string[];
  creation_time: number;
  last_modify_time: number;
  parent: string | undefined;
}

export function create_DirectoryMeta(name: string, parent?: string): DirMeta {
  const now = Date.now();
  return {
    type: MetaType.DirectoryMeta,
    name,
    files: [],
    creation_time: now,
    last_modify_time: now,
    parent,
  };
}

export interface FileMeta {
  type: MetaType.FileMeta;
  name: string;
  /** 文件大小，以字节为单位。 */
  size: number;
  creation_time: number;
  last_modify_time: number;
  parent: string;
}

export function create_FileMeta(
  name: string,
  size: number,
  parent_path: string
): FileMeta {
  const now = Date.now();
  return {
    type: MetaType.FileMeta,
    name,
    size,
    creation_time: now,
    last_modify_time: now,
    parent: parent_path,
  };
}

export type VirtualFileSystemMeta = FileMeta | DirMeta;

export class FileEntry<T extends VirtualFileSystemAcceptableType> {
  fs: VirtualFileSystem;
  full_path: string;
  file_meta: FileMeta;
  type = "FileEntry" as const;
  constructor(fs: VirtualFileSystem, path: string, file_meta: FileMeta) {
    this.fs = fs;
    this.full_path = path;
    this.file_meta = file_meta;
  }
  async read() {
    return (await this.fs.file_map.getItem(this.full_path)) as T;
  }
  async write(value: T) {
    const now = Date.now();

    this.file_meta.last_modify_time = now;
    this.file_meta.size = value.byteLength;

    await this.fs.fs_meta_map.setItem(this.full_path, this.file_meta);
    await this.fs.file_map.setItem(this.full_path, value);
  }
  meta(): FileMeta {
    return { ...this.file_meta };
  }
}

export class DirEntry {
  fs: VirtualFileSystem;
  full_path: string;
  dir_meta: DirMeta;
  type = "DirEntry" as const;
  constructor(fs: VirtualFileSystem, full_path: string, dir_meta: DirMeta) {
    this.fs = fs;
    this.full_path = full_path;
    this.dir_meta = dir_meta;
  }
  list() {
    return this.dir_meta.files;
  }
  meta(): DirMeta {
    return { ...this.dir_meta };
  }
}

/**  */
function parse_path(path: string) {
  let last_delimiter = path.lastIndexOf("/");
  let require_dir = false;

  let name = path.slice(last_delimiter + 1);

  if (name.length === 0 && path !== "") {
    last_delimiter = path.lastIndexOf("/", last_delimiter);
    name = path.slice(last_delimiter + 1);
    require_dir = true;
    if (last_delimiter === -1)
      throw new Error(`VirtualFileSystemError WrongPathname[${path}]`);
  }

  let parent_path: undefined | string = undefined;
  if (last_delimiter !== -1) parent_path = path.slice(0, last_delimiter);

  if (parent_path && parent_path.length > 1 && parent_path[0] === "/") {
    parent_path = parent_path.slice(1);
  }
  const full_path = (parent_path ? parent_path + "/" : "") + name;

  console.log({ path, parent_path, name, full_path });

  return {
    name,
    parent_path,
    /** 路径是否声明为文件夹 */
    require_dir,
    full_path,
  };
}

export default class VirtualFileSystem {
  fid: string;
  file_map: typeof localforage;
  fs_meta_map: typeof localforage;
  meta: typeof localforage;
  ready: Promise<void>;
  version = 1;

  constructor(fid: string) {
    this.fid = fid;
    this.file_map = createInstance({
      name: "fs:" + fid,
      description: `virtual file system ${fid} file map`,
    });
    this.fs_meta_map = createInstance({
      name: "meta_map:" + fid,
      description: `virtual file system ${fid} file meta map`,
    });
    this.meta = createInstance({
      name: "meta:" + fid,
      description: `virtual file system ${fid} version`,
    });
    this.ready = Promise.all([
      this.fs_meta_map.ready(),
      this.file_map.ready(),
      this.meta.ready(),
    ]).then(async () => {
      const version: number | null = await this.meta.getItem("version");
      if (version === this.version) return;
      if (version === null) {
        // 文件系统未安装
        await this.fs_meta_map.setItem("", create_DirectoryMeta(""));
        await this.meta.setItem("version", version);
        return;
      }
      // 升级代码...
    });
  }

  async open_file<T extends VirtualFileSystemAcceptableType>(
    path: string,
    create: boolean = false
  ) {
    const { parent_path, name, require_dir, full_path } = parse_path(path);

    let meta: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      full_path
    );
    if (require_dir)
      throw new Error(
        `VirtualFileSystemError FilePatheRquired[${path}]: A file is required, but the path requires a directory (with a / suffix)`
      );

    if (!create && !meta)
      throw new Error(`VirtualFileSystemError PathNotExist[${path}]`);
    else if (create) {
      const parent: VirtualFileSystemMeta | null =
        await this.fs_meta_map.getItem(parent_path ?? "");
      if (!parent)
        throw new Error(
          `VirtualFileSystemError DirNotExist[${parent_path}]: The directory already exists when trying to create the directory`
        );
      if (parent.type !== MetaType.DirectoryMeta)
        throw new Error(
          `VirtualFileSystemError ParentNotDir[${parent_path}]: parent is not a directory`
        );
      parent.files.push(full_path);

      meta = create_FileMeta(name, 0, parent_path ?? "");
      await this.fs_meta_map.setItem(parent_path ?? "", parent);
      await this.fs_meta_map.setItem(full_path, meta);
      await this.file_map.setItem(full_path, new ArrayBuffer(0));
    }

    if (meta!.type !== MetaType.FileMeta) {
      throw new Error(
        `VirtualFileSystemError PathNotFile[${path}]: path is not a file`
      );
    }

    return new FileEntry<T>(this, full_path, meta as FileMeta);
  }

  async open_dir(path: string, create: boolean = false) {
    const { parent_path, name, full_path } = parse_path(path);
    let meta: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      full_path
    );

    if (!create && !meta)
      throw new Error(`VirtualFileSystemError PathNotExist[${full_path}]`);
    else if (create) {
      const parent: VirtualFileSystemMeta | null =
        await this.fs_meta_map.getItem(parent_path ?? "");
      if (!parent)
        throw new Error(`VirtualFileSystemError DirNotExist[${parent_path}]`);
      if (parent.type !== MetaType.DirectoryMeta)
        throw new Error(
          `VirtualFileSystemError ParentNotDir[${parent_path}]: parent is not a directory`
        );
      parent.files.push(full_path);

      meta = create_DirectoryMeta(name, parent_path);
      await this.fs_meta_map.setItem(parent_path ?? "", parent);
      await this.fs_meta_map.setItem(full_path, meta);
    }

    console.log(meta);

    if (meta!.type !== MetaType.DirectoryMeta) {
      throw new Error(
        `VirtualFileSystemError PathNotDir[${path}]: path is not a directory`
      );
    }

    return new DirEntry(this, full_path, meta as DirMeta);
  }

  async entry(path: string) {
    const { parent_path, name, full_path } = parse_path(path);
    let meta: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      full_path
    );
    return meta;
  }

  async exist(path: string) {
    const keys = await this.fs_meta_map.keys();
    /** n 为路径数，O(n) */
    return keys.indexOf(path) !== -1;
  }
  async get_path_type(path: string) {
    const meta: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      path
    );
    if (!meta) throw new Error(`VirtualFileSystemError PathNotExist[${path}]`);
    return meta.type;
  }
  async create_dir(path: string) {
    if (await this.exist(path)) {
      throw new Error(
        `VirtualFileSystemError PathExist[${path}]: The path already exists when trying to create the directory`
      );
    }
    const { parent_path, name, full_path } = parse_path(path);
    const parent: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      parent_path ?? ""
    );
    if (!parent)
      throw new Error(
        `VirtualFileSystemError DirNotExist[${parent_path}]: The directory already exists when trying to create the directory`
      );
    if (parent.type !== MetaType.DirectoryMeta)
      throw new Error(
        `VirtualFileSystemError ParentNotDir[${parent_path}]: parent is not a directory`
      );

    parent.files.push(full_path);

    const new_dir = create_DirectoryMeta(name, parent_path ?? "");
    await this.fs_meta_map.setItem(parent_path ?? "", parent);
    await this.fs_meta_map.setItem(full_path, new_dir);
  }
  async remove(path: string) {
    const { parent_path, name, full_path } = parse_path(path);
    const meta: VirtualFileSystemMeta | null = await this.fs_meta_map.getItem(
      full_path
    );
    if (!meta) {
      throw new Error(
        `VirtualFileSystemError PathExist[${path}]: The path already exists when trying to create the directory`
      );
    }
    await this.fs_meta_map.removeItem(full_path);
    await this.file_map.removeItem(full_path);
    if (meta.type === MetaType.FileMeta) {
      return;
    }

    for (const file_full_path of meta.files) {
      this.remove(file_full_path);
    }
  }
}
