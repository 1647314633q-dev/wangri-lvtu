#!/usr/bin/env python3
"""把「往日旅途_按個人經歷擴充版」素材包轉成遊戲用資料。

用法：
  python3 scripts/import-materials.py <素材包資料夾> [--photos]

輸出：
  src/data/materials.js                         92 筆素材（文字、問題、標籤、相片資料；唔含相片本身）
  src/assets/images/materials/svg/<id>.svg      每筆一張「示意插畫」（公開版用，會提交 Git）
  src/assets/images/materials/photos/<名>.jpg   （加 --photos 先會輸出）真實相片縮細版，只供本地預覽；
                                                 .gitignore 已忽略 jpg，唔會推上 GitHub

原有問題同廣東話用字照原文保留；只喺下面 OVERRIDES 加遊戲需要嘅欄位（共用物件 key、經歷標籤、限制）。
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
WITH_PHOTOS = '--photos' in sys.argv

old = json.load(open(os.path.join(SRC, '原有分齡素材', '資料.json'), encoding='utf-8'))
new = json.load(open(os.path.join(SRC, '新增素材.json'), encoding='utf-8'))

DEFAULT_NO_EXP = '唔緊要，我哋可以揀另一件物件，或者講你想講嘅經歷。'
CHAPTER_OF_STAGE = {'01_童年': 'childhood', '03_社會': 'society', '04_期間大事件': 'events', '05_晚年生活': 'later'}

# ---- 原 52 項：經歷標籤、共用物件 key、地點限制（hk = 香港專屬街景／交通，本人表示主要喺香港以外生活時唔揀） ----
# tags 用八類經歷：education trade factory care business rural away community；另外：
#   play = 童年玩樂；work = 一般受薪工作情境（已確認以照顧家人為主、冇工作類經歷時唔反覆問）
OLD = {
    '1940-01-01': dict(tags=['play'], key='comics'),
    '1940-01-02': dict(tags=['play']),
    '1940-01-03': dict(tags=['play']),
    '1940-01-04': dict(tags=['play']),
    '1940-01-05': dict(tags=['play']),
    '1940-01-06': dict(tags=['care', 'play'], key='babysit'),
    '1940-03-01': dict(tags=['factory', 'trade']),
    '1940-03-02': dict(tags=['factory', 'work']),
    '1940-03-03': dict(tags=['factory']),
    '1940-03-04': dict(tags=['factory', 'work']),
    '1940-03-05': dict(tags=['factory', 'work']),
    '1940-03-06': dict(tags=['factory']),
    '1950-01-01': dict(tags=['play']),
    '1950-01-02': dict(tags=['play']),
    '1950-01-03': dict(tags=['play', 'education'], key='library-bus'),
    '1950-01-04': dict(tags=['play']),
    '1950-01-05': dict(tags=['play']),
    '1950-01-06': dict(tags=['play']),
    '1950-03-01': dict(tags=['business'], key='stall'),
    '1950-03-02': dict(tags=['trade']),
    '1950-03-03': dict(tags=[], key='boat'),
    '1950-03-04': dict(tags=['work']),
    '1950-03-05': dict(tags=['business', 'work']),
    '1950-03-06': dict(tags=['community']),
    '1960-01-01': dict(tags=['play']),
    '1960-01-02': dict(tags=['play']),
    '1960-01-03': dict(tags=['play', 'community']),
    '1960-01-04': dict(tags=['play']),
    '1960-01-05': dict(tags=['play', 'education'], key='brush'),
    '1960-01-06': dict(tags=['play']),
    '1960-03-01': dict(tags=['business'], hk=True),
    '1960-03-02': dict(tags=['trade', 'work']),
    '1960-03-03': dict(tags=['work']),
    '1960-03-04': dict(tags=[], hk=True),
    '1960-03-05': dict(tags=['business', 'care']),
    '1960-03-06': dict(tags=[], hk=True),
    '共用-17': dict(tags=[]),
    '共用-18': dict(tags=['away'], key='leave'),
    '共用-19': dict(tags=[]),
    '共用-20': dict(tags=['care'], key='water-ration'),
    '共用-21': dict(tags=[]),
    '共用-22': dict(tags=[]),
    '共用-23': dict(tags=['community']),
    '共用-24': dict(tags=[]),
    '共用-25': dict(tags=['community'], key='photography'),
    '共用-26': dict(tags=[]),
    '共用-27': dict(tags=[]),
    '共用-28': dict(tags=['community']),
    '共用-29': dict(tags=[]),
    '共用-30': dict(tags=['community']),
    '共用-31': dict(tags=[]),
    '共用-32': dict(tags=['education']),
}
# ---- 新 40 項：放喺邊一章、共用 key、前提 ----
#   needsSchool：要本人第二章答 A／B（有返過學）先會出；needsRural：要本人揀咗「鄉郊與水上生活」
NEW = {
    'E01': dict(chapter='learning', key='rooftop', needsSchool=True),
    'E02': dict(chapter='learning', needsSchool=True),
    'E03': dict(chapter='learning', key='library'),
    'E04': dict(chapter='learning', needsSchool=True),
    'E05': dict(chapter='learning', key='school-building', needsSchool=True),
    'E08': dict(key='carpentry'),
    'E19': dict(key='water-carry'),
    'E20': dict(key='plastic-flowers'),
    'E23': dict(key='stall'),
    'E28': dict(needsSchool=True),
    'E30': dict(key='radio'),
    'E31': dict(key='leave'),
    'E33': dict(key='boat'),
    'E36': dict(key='photography'),
}


def years(text):
    ys = [int(y) for y in re.findall(r'(1[89]\d\d|20\d\d)', text or '')]
    if not ys:
        return None, None
    lo, hi = min(ys), max(ys)
    if '年代' in text and hi % 10 == 0:
        hi += 9
    return lo, hi


def safe_id(src_id):
    return src_id.replace('共用-', 'S')


photo_names = {}   # sha → 檔名（同一張相只出一個檔）
records = []


def photo_meta(x, image_path):
    data = open(image_path, 'rb').read()
    sha = hashlib.sha256(data).hexdigest()
    name = photo_names.setdefault(sha, 'p-' + safe_id(x['id']))
    # 原 52 項用素材包已核對嘅 year_from／year_to（「未詳」= None）；新 40 項由 photo_year 文字推算，
    # 「未詳」或者只有報道刊載年份嘅，唔當作拍攝年份
    if 'year_from' in x:
        lo, hi = x.get('year_from'), x.get('year_to')
    elif '未詳' in (x.get('photo_year') or ''):
        lo, hi = None, None
    else:
        lo, hi = years(x.get('photo_year'))
    return dict(file=name, year=x.get('photo_year', ''), from_=lo, to=hi, ref=x.get('archive_ref', ''),
                source=x.get('source', ''), url=x.get('source_url', ''), caption=x.get('source_caption', ''),
                desc=x.get('photo_description', ''), note=x.get('match_note', ''), rights=x.get('rights', '')), data


photo_out = os.path.join(ROOT, 'src/assets/images/materials/photos')
svg_out = os.path.join(ROOT, 'src/assets/images/materials/svg')
os.makedirs(svg_out, exist_ok=True)
if WITH_PHOTOS:
    os.makedirs(photo_out, exist_ok=True)
    from PIL import Image
    import io

written = set()


def write_photo(name, data):
    if not WITH_PHOTOS or name in written:
        return
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.thumbnail((1280, 1280))
    im.save(os.path.join(photo_out, name + '.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
    written.add(name)


for x in old:
    ov = OLD[x['id']]
    meta, data = photo_meta(x, os.path.join(SRC, '原有分齡素材', x['image_file']))
    write_photo(meta['file'], data)
    ch = CHAPTER_OF_STAGE[x['stage']]
    records.append(dict(
        id='m-' + safe_id(x['id']), src=x['id'], word=x['word'], chapter=ch,
        groups=[x['group']] if x['group'] != '共用' else ['1940', '1950', '1960'],
        tags=ov['tags'], key=ov.get('key') or 'm-' + safe_id(x['id']), hk=ov.get('hk', False),
        question=x['question'], prompt='', follow=x['follow_up'],
        noExp=DEFAULT_NO_EXP if ch != 'childhood' else '',
        photo=meta,
    ))

for x in new:
    ov = NEW.get(x['id'], {})
    meta, data = photo_meta(x, os.path.join(SRC, x['image_file']))
    write_photo(meta['file'], data)
    ch = ov.get('chapter', 'society')
    records.append(dict(
        id='m-' + x['id'], src=x['id'], word=x['word'], chapter=ch, groups=['1940', '1950', '1960'],
        tags=[x['route']],
        key=ov.get('key') or 'm-' + x['id'], hk=False,
        needsSchool=ov.get('needsSchool', False), needsRural=x['id'] == 'E28',
        question=x['entry_question'], prompt=x['confirmed_question'], follow=x['follow_up'],
        noExp=x['no_experience_response'], stage=x['stage'],
        photo=meta,
    ))

for r in records:
    r['photo']['from'] = r['photo'].pop('from_')

# ---- 示意插畫 ----
EMBLEM = dict(play='玩', care='家', factory='工', trade='藝', business='舖', rural='村', away='行', community='友',
              education='學', work='做')
CH_EMBLEM = dict(events='事', later='今', childhood='童', society='社', learning='學')


def svg(word, emblem):
    size = 120 if len(word) <= 3 else 96 if len(word) <= 4 else 78 if len(word) <= 5 else 64
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">'
            '<defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#efe3c6"/><stop offset="1" stop-color="#d8c39a"/></linearGradient></defs>'
            '<rect width="800" height="600" fill="url(#bg)"/>'
            '<rect x="40" y="40" width="720" height="520" fill="none" stroke="#8a5a34" stroke-width="4" stroke-dasharray="14 10"/>'
            '<g transform="translate(400 210) rotate(-6)"><circle r="78" fill="#fff8ea" stroke="#9c3b2a" stroke-width="7"/>'
            f'<text y="30" text-anchor="middle" font-family="Noto Serif TC,serif" font-size="84" fill="#9c3b2a">{emblem}</text></g>'
            f'<text x="400" y="{400 + size // 3}" text-anchor="middle" font-family="Noto Serif TC,serif" font-weight="700" font-size="{size}" letter-spacing="8" fill="#3d2b1f">{word}</text>'
            '<g transform="translate(640 548)"><rect x="-6" y="-26" width="150" height="38" rx="4" fill="#f7efdc" stroke="#9c3b2a" stroke-width="2"/>'
            '<text x="69" y="1" text-anchor="middle" font-family="Noto Sans TC,sans-serif" font-size="20" fill="#9c3b2a">示意插畫</text></g></svg>')


for r in records:
    first = next((t for t in r['tags'] if t in EMBLEM), None)
    em = EMBLEM[first] if first else CH_EMBLEM[r['chapter']]
    open(os.path.join(svg_out, r['id'][2:] + '.svg'), 'w', encoding='utf-8').write(svg(r['word'], em))

out = os.path.join(ROOT, 'src/data/materials.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('// 由 scripts/import-materials.py 產生，請勿手改；改素材請改素材包再重新執行。\n')
    f.write('// 原有分齡素材 52 項 + 新增經歷素材 40 項 = 92 筆候選。問題文字照素材包原文。\n')
    f.write('// photo.file：本地相片檔名（src/assets/images/materials/photos/，只供本地預覽）；冇相片就用 svg/<id>.svg 示意插畫。\n')
    f.write('export const MATERIALS = ' + json.dumps(records, ensure_ascii=False, indent=1) + '\n')
print(len(records), 'records;', len(photo_names), 'distinct photos;', len(written), 'written')
