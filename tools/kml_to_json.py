"""My Maps KML → data/map.json (폴더별 장소 목록). GitHub Actions와 로컬에서 같이 씀."""
import html, json, re, sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()

def clean(t):
    t = (t or "").replace("<![CDATA[", "").replace("]]>", "")
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"<img[^>]*>", "", t)
    return html.unescape(re.sub(r"<[^>]+>", "", t)).strip()

folders = []
for f in re.findall(r"<Folder>(.*?)</Folder>", s, re.S):
    fname = clean(re.search(r"<name>(.*?)</name>", f, re.S).group(1))
    places = []
    for p in re.findall(r"<Placemark>(.*?)</Placemark>", f, re.S):
        n = re.search(r"<name>(.*?)</name>", p, re.S)
        c = re.search(r"<Point>\s*<coordinates>\s*([-\d.]+),([-\d.]+)", p)
        if not c:
            continue
        d = re.search(r"<description>(.*?)</description>", p, re.S)
        places.append({
            "n": clean(n.group(1)) if n else "",
            "lat": round(float(c.group(2)), 6),
            "lng": round(float(c.group(1)), 6),
            "d": clean(d.group(1))[:300] if d else "",
        })
    if places:
        folders.append({"name": fname, "places": places})

if not folders:
    sys.exit("장소를 하나도 못 찾았어요 — KML 형식 확인 필요")
json.dump({"folders": folders}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sum(len(f["places"]) for f in folders), "places in", len(folders), "folders")
