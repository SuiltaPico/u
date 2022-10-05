import * as monaco from "monaco-editor";

export async function use_prettier_typescript() {
  const prettier = await import("prettier/standalone");
  const prettier_typescript = await import("prettier/parser-typescript");

  // use prettier to
  monaco.languages.registerDocumentFormattingEditProvider("typescript", {
    async provideDocumentFormattingEdits(model, options, token) {
      const result = prettier.format(model.getValue(), {
        parser: "typescript",
        plugins: [prettier_typescript],
      });

      return [
        {
          range: model.getFullModelRange(),
          text: result,
        },
      ];
    },
  });
}
