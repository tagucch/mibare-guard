import * as vscode from 'vscode';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitFor = async (
  predicate: () => boolean,
  { timeoutMs = 3000, stepMs = 50 }: { timeoutMs?: number; stepMs?: number } = {},
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await sleep(stepMs);
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
};

export const closeAllEditors = async (): Promise<void> => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
};

export const resetConfig = async (): Promise<void> => {
  const config = vscode.workspace.getConfiguration('secretFileCautioner');
  await config.update('enabled', undefined, vscode.ConfigurationTarget.Workspace);
  await config.update('filePatterns', undefined, vscode.ConfigurationTarget.Workspace);
};

export const ensureExtensionActivated = async (): Promise<void> => {
  const ext = vscode.extensions.getExtension('tagucch.secret-file-cautioner');
  if (!ext) {
    throw new Error('Extension not found');
  }
  if (!ext.isActive) {
    await ext.activate();
  }
};
