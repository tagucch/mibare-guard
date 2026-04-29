// ファイル名が与えられたパターンのいずれかにマッチするか判定する。
// パターンの書式:
//   正規表現: スラッシュで囲む (例: /^\.env.*/)
//   部分一致: それ以外の文字列 (例: ".env"。部分文字列としてマッチ)
//   完全一致は部分一致の特殊ケース
export const matchesAnyPattern = (fileName: string, patterns: string[]): boolean =>
  patterns.some((pattern) => matchesPattern(fileName, pattern));

const matchesPattern = (fileName: string, pattern: string): boolean => {
  if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
    const regexSource = pattern.slice(1, -1);
    try {
      const regex = new RegExp(regexSource);
      return regex.test(fileName);
    } catch {
      // 不正な正規表現 — 部分一致にフォールバック
      return fileName.includes(pattern);
    }
  }
  return fileName.includes(pattern);
};
