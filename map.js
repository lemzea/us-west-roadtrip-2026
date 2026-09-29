// GitHub Pages 전용: KMZ에서 뽑은 장소를 Leaflet 지도에 표시하고, 날짜별로 걸러 보기
(function () {
  const T = window.TRIP;
  const el = document.getElementById("tripmap");
  if (!T || !el || !window.L) return;

  const css = getComputedStyle(document.documentElement);
  const color = seg => (seg === 1 ? css.getPropertyValue("--juniper") : seg === 2 ? css.getPropertyValue("--amber") : css.getPropertyValue("--muted")).trim();

  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const layers = {};
  const all = [];
  T.days.forEach(d => {
    const list = (T.places[d.id] || []).filter(p => typeof p.lat === "number");
    if (!list.length) return;
    const g = L.layerGroup();
    list.forEach(p => {
      const m = L.circleMarker([p.lat, p.lng], { radius: 7, weight: 2, color: "#fff", fillColor: color(d.seg), fillOpacity: 0.95 });
      const box = document.createElement("div");
      const b = document.createElement("b"); b.textContent = p.n; box.appendChild(b);
      box.appendChild(document.createElement("br"));
      const s = document.createElement("span"); s.textContent = `${d.date} ${d.wd} · `; box.appendChild(s);
      const a = document.createElement("a"); a.href = T.navUrl(p); a.target = "_blank"; a.rel = "noopener"; a.textContent = "길찾기";
      box.appendChild(a);
      m.bindPopup(box);
      g.addLayer(m);
      all.push([p.lat, p.lng]);
    });
    layers[d.id] = { group: g, pts: list.map(p => [p.lat, p.lng]), label: `${d.date} ${d.wd}` };
  });

  const bar = document.getElementById("mapfilter");
  const show = id => {
    Object.values(layers).forEach(l => map.removeLayer(l.group));
    const pick = id === "all" ? Object.values(layers) : [layers[id]];
    const pts = [];
    pick.forEach(l => { l.group.addTo(map); pts.push(...l.pts); });
    if (pts.length) map.fitBounds(pts, { padding: [24, 24], maxZoom: 14 });
    bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  };
  bar.innerHTML = `<button type="button" data-id="all">전체</button>` +
    Object.entries(layers).map(([id, l]) => `<button type="button" data-id="${id}">${l.label}</button>`).join("");
  bar.addEventListener("click", e => { const b = e.target.closest("button"); if (b) show(b.dataset.id); });
  show("all");
})();
