// GitHub Pages 전용: Google My Maps에서 동기화한 장소(data/map.json)를 Leaflet 지도에 표시.
// data/map.json 은 GitHub Actions(sync-mymaps)가 1시간마다 갱신. 못 불러오면 페이지에 내장된 장소로 대체.
(function () {
  const T = window.TRIP;
  const el = document.getElementById("tripmap");
  if (!T || !el || !window.L) return;

  const css = getComputedStyle(document.documentElement);
  const tok = n => css.getPropertyValue(n).trim();
  const colorFor = name => /1구간/.test(name) ? tok("--juniper") : /2구간/.test(name) ? tok("--amber") : tok("--muted");

  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const bar = document.getElementById("mapfilter");
  const note = document.getElementById("mapnote");

  function render(groups) {
    const layers = {};
    groups.forEach((g, i) => {
      const lg = L.layerGroup();
      const pts = [];
      g.places.forEach(p => {
        const m = L.circleMarker([p.lat, p.lng], { radius: 7, weight: 2, color: "#fff", fillColor: g.color, fillOpacity: 0.95 });
        const box = document.createElement("div");
        const b = document.createElement("b"); b.textContent = p.n; box.appendChild(b);
        if (p.d) { const d = document.createElement("div"); d.style.whiteSpace = "pre-line"; d.textContent = p.d; box.appendChild(d); }
        const a = document.createElement("a"); a.href = T.navUrl(p); a.target = "_blank"; a.rel = "noopener"; a.textContent = "길찾기";
        box.appendChild(a);
        m.bindPopup(box);
        lg.addLayer(m); pts.push([p.lat, p.lng]);
      });
      layers["g" + i] = { group: lg, pts, label: g.label };
    });
    const show = id => {
      Object.values(layers).forEach(l => map.removeLayer(l.group));
      const pick = id === "all" ? Object.values(layers) : [layers[id]];
      const pts = [];
      pick.forEach(l => { l.group.addTo(map); pts.push(...l.pts); });
      if (pts.length) map.fitBounds(pts, { padding: [24, 24], maxZoom: 14 });
      bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    };
    bar.innerHTML = `<button type="button" data-id="all">전체</button>` +
      Object.entries(layers).map(([id, l]) => `<button type="button" data-id="${id}"></button>`).join("");
    Object.entries(layers).forEach(([id, l]) => { bar.querySelector(`[data-id="${id}"]`).textContent = l.label; });
    bar.onclick = e => { const b = e.target.closest("button"); if (b) show(b.dataset.id); };
    show("all");
  }

  // 내장 장소(날짜별) — 동기화 데이터를 못 불러올 때
  const fallback = () => T.days
    .map(d => ({ label: `${d.date} ${d.wd}`, color: d.seg === 1 ? tok("--juniper") : d.seg === 2 ? tok("--amber") : tok("--muted"),
                 places: (T.places[d.id] || []).filter(p => typeof p.lat === "number") }))
    .filter(g => g.places.length);

  const short = name => name.replace(/\s*-\s*\d{2}\.\d{2}\.\d{2}.*$/, "").replace(/^\d구간\s*/, "").replace(/[()]/g, "").trim() || name;

  fetch("https://raw.githubusercontent.com/lemzea/us-west-roadtrip-2026/main/data/map.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(j => {
      render(j.folders.map(f => ({ label: short(f.name), color: colorFor(f.name), places: f.places })));
      if (note) note.textContent = "Google My Maps와 1시간마다 자동 동기화돼요. 점을 누르면 이름과 길찾기 링크가 나와요.";
    })
    .catch(() => render(fallback()));
})();
