import { describe, it, expect } from 'vitest';
import { matchesAnyPattern } from '../../src/filePatternMatcher';

describe('matchesAnyPattern', () => {
  describe('部分一致', () => {
    it('パターンがファイル名に含まれていれば true', () => {
      expect(matchesAnyPattern('.env', ['.env'])).toBe(true);
      expect(matchesAnyPattern('.env.local', ['.env'])).toBe(true);
      expect(matchesAnyPattern('my-env-file', ['env'])).toBe(true);
    });

    it('パターンが含まれていなければ false', () => {
      expect(matchesAnyPattern('foo.txt', ['.env'])).toBe(false);
      expect(matchesAnyPattern('readme.md', ['secret'])).toBe(false);
    });
  });

  describe('正規表現', () => {
    it('スラッシュで囲まれたパターンは正規表現として扱われる', () => {
      expect(matchesAnyPattern('.env.local', ['/^\\.env\\..+$/'])).toBe(true);
      expect(matchesAnyPattern('.env', ['/^\\.env$/'])).toBe(true);
    });

    it('正規表現にマッチしなければ false', () => {
      expect(matchesAnyPattern('credentials.json', ['/^\\.env$/'])).toBe(false);
      expect(matchesAnyPattern('foo.env.bak', ['/^\\.env\\..+$/'])).toBe(false);
    });

    it('$ による末尾指定が効く', () => {
      expect(matchesAnyPattern('foo.pem', ['/\\.pem$/'])).toBe(true);
      expect(matchesAnyPattern('foo.pem.bak', ['/\\.pem$/'])).toBe(false);
    });

    it('不正な正規表現は部分一致にフォールバック', () => {
      // '[' を含む壊れたパターンを文字列として部分一致させる
      expect(matchesAnyPattern('has-/[bad-pattern/-in-it', ['/[bad-pattern/'])).toBe(true);
      expect(matchesAnyPattern('clean', ['/[bad-pattern/'])).toBe(false);
    });
  });

  describe('複数パターン (OR)', () => {
    it('いずれか1つにマッチすれば true', () => {
      expect(matchesAnyPattern('config.json', ['.env', 'config'])).toBe(true);
      expect(matchesAnyPattern('.pem.bak', ['/\\.pem$/', '.pem'])).toBe(true);
    });

    it('すべて非マッチなら false', () => {
      expect(matchesAnyPattern('readme.md', ['.env', 'secret', '/\\.pem$/'])).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('空の patterns は常に false', () => {
      expect(matchesAnyPattern('.env', [])).toBe(false);
    });

    it('長さ2以下のスラッシュ囲みは部分一致扱い (正規表現として解釈しない)', () => {
      // '//' は空の regex とみなされず、部分一致する
      expect(matchesAnyPattern('path//thing', ['//'])).toBe(true);
    });
  });
});
