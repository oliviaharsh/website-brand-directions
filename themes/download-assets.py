"""Fetch pinned Three.js and self-hosted Google Fonts for the theme prototypes."""
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parent
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()

fonts = [
    ('Barlow Condensed', 'barlowcondensed', '600'),
    ('Public Sans', 'publicsans', '400;600'),
    ('Unbounded', 'unbounded', '500'),
    ('Onest', 'onest', '400;600'),
    ('Cormorant Garamond', 'cormorantgaramond', '500'),
    ('Karla', 'karla', '400;600'),
    ('Urbanist', 'urbanist', '500;600'),
    ('Work Sans', 'worksans', '400;600'),
]
folder = ROOT / 'fonts'
folder.mkdir(parents=True, exist_ok=True)
css = []
for family, slug, weights in fonts:
    source = fetch('https://fonts.googleapis.com/css2?family=' + family.replace(' ', '+') + ':wght@' + weights + '&display=swap').decode()
    blocks = re.findall(r'/\* latin \*/\s*(@font-face\s*\{[^}]+\})', source)
    if not blocks:
        raise RuntimeError('No latin font faces for ' + family)
    for i, block in enumerate(blocks):
        url = re.search(r'url\(([^)]+)\)', block).group(1)
        name = f'{slug}-{i}.woff2'
        (folder / name).write_bytes(fetch(url))
        css.append(block.replace(url, 'fonts/' + name))
    (folder / (slug + '-OFL.txt')).write_bytes(fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/' + slug + '/OFL.txt'))
    print(f'{family}: {len(blocks)} latin font faces')
(ROOT / 'fonts.css').write_text('\n'.join(css), encoding='utf-8')
vendor = ROOT / 'vendor'
vendor.mkdir(exist_ok=True)
base = 'https://cdn.jsdelivr.net/npm/three@0.170.0/'
for source, dest in [('build/three.module.min.js', 'three.module.js'), ('examples/jsm/environments/RoomEnvironment.js', 'RoomEnvironment.js'), ('LICENSE', 'THREE-LICENSE.txt')]:
    (vendor / dest).write_bytes(fetch(base + source))
    print('Saved ' + dest)
