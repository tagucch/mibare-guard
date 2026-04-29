import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../src/htmlEscape';

describe('escapeHtml', () => {
  it('& を &amp; に変換する', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('< と > を &lt; / &gt; に変換する', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('ダブルクォートを &quot; に変換する', () => {
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
  });

  it("シングルクォートを &#39; に変換する", () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('プレーンテキストはそのまま返す', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
    expect(escapeHtml('')).toBe('');
  });

  it('& を先に変換するので二重エスケープが起きない', () => {
    // '<' を先に変換すると '&lt;' になり、その後 '&' を変換すると '&amp;lt;' になる。
    // 正しい実装では '&' を先に変換するので '&amp;lt;' は生成されない。
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('&<')).toBe('&amp;&lt;');
  });

  it('XSS の典型パターンを無害化する', () => {
    const input = '<script>alert("xss")</script>';
    const escaped = escapeHtml(input);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(escaped).not.toContain('<script>');
  });

  it('既にエスケープ済みのエンティティも再度エスケープされる (リテラル扱い)', () => {
    // HTML としてデコードするのは閲覧側の責務。ここでは入力を文字として扱う。
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
