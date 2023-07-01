import path from "path";
import * as vscode from "vscode";
import prettier, { Options } from "prettier";
import ulkaFormat from "@ulkajs/format";

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("ulka", {
    provideDocumentFormattingEdits(document: vscode.TextDocument) {
      return format(document);
    },
  });

  vscode.languages.registerDocumentRangeFormattingEditProvider("ulka", {
    provideDocumentRangeFormattingEdits(
      document: vscode.TextDocument,
      range: vscode.Range
    ) {
      return format(document, {
        rangeEnd: document.offsetAt(range.end),
        rangeStart: document.offsetAt(range.start),
      });
    },
  });
}

const format = async (document: vscode.TextDocument, options: Options = {}) => {
  let config: any =
    vscode.workspace.getConfiguration("prettier", document.uri) || {};

  config = {
    ...config,
    ...options,
    ...(await prettier.resolveConfig(document.fileName, { useCache: false })),
  };

  const workspacePath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
    .path;

  const ignored = workspacePath
    ? await isIgnored(
        document.fileName,
        path.join(workspacePath, ".prettierignore")
      )
    : false;

  if (ignored) return [];

  const lastLineId = document.lineCount - 1;
  const range = new vscode.Range(
    0,
    0,
    lastLineId,
    document.lineAt(lastLineId).text.length
  );

  return [
    vscode.TextEdit.replace(range, ulkaFormat(document.getText(), config)),
  ];
};

const isIgnored = async (filepath: string, ignorePath?: string) => {
  try {
    return (await prettier.getFileInfo(filepath, { ignorePath })).ignored;
  } catch (err) {
    return false;
  }
};
