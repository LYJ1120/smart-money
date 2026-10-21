"""生成纸墨主题标题用的思源宋体子集。

只收集使用 --font-display 的标题类元素里出现的字，再通过 Google Fonts 的 text= 参数
下载只包含这些字的 woff2，存到 fonts/。标题文案改动后重新运行：

    python tools/build_fonts.py
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import string
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'works.html']
# 与 css 中使用 var(--font-display) 的选择器保持一致
DISPLAY_CLASSES = {
    'hi-name', 'hero-title', 'section-h2', 'bc-title', 'exp-company', 'edu-name', 'm-num',
    'teaser-title', 'works-title', 'work-title', 'wi-name', 'fact-num', 'outro-title', 'seal',
}
VOID = {'br', 'img', 'meta', 'link', 'input', 'hr', 'source', 'path', 'circle', 'rect'}
# 英文标题与常用标点全部收录，保证切换语言后标题字形一致
EXTRA = string.printable.strip() + '’‘“”—–·×→↗↑…、，。：；！？（）「」《》%'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'


class DisplayText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.chars = set()

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        classes = set((dict(attrs).get('class') or '').split())
        self.stack.append(bool(classes & DISPLAY_CLASSES))

    def handle_endtag(self, tag):
        if tag not in VOID and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if any(self.stack):
            self.chars.update(data)


def collect():
    chars = set(EXTRA)
    for page in PAGES:
        parser = DisplayText()
        parser.feed((ROOT / page).read_text(encoding='utf-8'))
        chars |= parser.chars
    return ''.join(sorted(c for c in chars if not c.isspace()))


def download(text, weight):
    query = urllib.parse.urlencode({'family': f'Noto Serif SC:wght@{weight}', 'text': text, 'display': 'swap'})
    req = urllib.request.Request(f'https://fonts.googleapis.com/css2?{query}', headers={'User-Agent': UA})
    css = urllib.request.urlopen(req, timeout=60).read().decode()
    url = re.search(r'url\((https://[^)]+)\)', css).group(1)
    data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=120).read()
    out = ROOT / 'fonts' / f'noto-serif-sc-{weight}.woff2'
    out.write_bytes(data)
    return out, len(data)


if __name__ == '__main__':
    text = collect()
    cjk = sum(1 for c in text if '一' <= c <= '鿿')
    print(f'{len(text)} glyphs ({cjk} CJK)')
    for weight in (700, 900):
        path, size = download(text, weight)
        print(f'{path.relative_to(ROOT)}: {size // 1024} KB')
