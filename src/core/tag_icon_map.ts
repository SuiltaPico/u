export const raw_tag_icon_map: {
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