// 서류 · 바우처 (공개 페이지용) — 타임라인 행에 붙는 📄 링크
// docs/*.bin 은 AES-256-GCM으로 암호화돼 있고, 키는 Firestore private/bookings.dockey 에만 있다.
// 허용된 계정으로 로그인하면 firebase-sync.js 가 unlock(key) 를 호출한다.
(() => {
  let key = null;
  const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - s.length % 4) % 4)), c => c.charCodeAt(0));
  const decrypt = async (buf) => {
    const u8 = new Uint8Array(buf);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: u8.slice(0, 12) }, key, u8.slice(12));
  };
  const fetchDec = async (name, fresh) => {
    const r = await fetch("docs/" + name + (fresh ? "?t=" + Date.now() : ""), { cache: fresh ? "no-store" : "default" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return decrypt(await r.arrayBuffer());
  };
  const openDoc = async (m) => {
    const dv = window.TRIP_DOCVIEW; if (!dv) return;
    try {
      const plain = await fetchDec(m.file);
      const url = URL.createObjectURL(new Blob([plain], { type: m.mime }));
      dv.open(url, m.k, m.t, m.k === "pdf" ? new Uint8Array(plain) : undefined);
    } catch (err) {
      alert("서류를 열지 못했어요: " + (err && err.message || err));
    }
  };
  const note = (msg) => { const el = document.getElementById("dayctl-msg"); if (el) el.textContent = msg; };
  const lock = () => { key = null; window.TRIP_ATTACH_DOCS?.([]); };
  const unlock = async (keyStr) => {
    if (!keyStr) { lock(); note("서류·바우처: Firestore private/bookings 문서에 dockey 필드가 없어요 — 키를 넣으면 일정 안에 📄가 보여요."); return; }
    try {
      key = await crypto.subtle.importKey("raw", b64u(keyStr), "AES-GCM", false, ["decrypt"]);
      const items = JSON.parse(new TextDecoder().decode(await fetchDec("manifest.bin", true)));
      window.TRIP_ATTACH_DOCS?.(items.map(m => ({ at: m.at, label: m.t, href: m.link, open: () => openDoc(m) })));
      note(`서류·바우처 ${items.length}개 — 일정 항목 아래 📄 버튼, 또는 위 '📄 서류'에서 모아보기.`);
    } catch (e) {
      console.warn("[trip] docs unlock failed:", e && e.message);
      note("서류·바우처를 못 열었어요 (" + (e && e.message || e) + ") — dockey 값이 맞는지 확인.");
      lock();
    }
  };
  window.TRIP_DOCS = { unlock, lock };
})();
