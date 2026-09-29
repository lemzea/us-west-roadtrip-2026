// GitHub Pages에서 열었을 때: 구글 로그인 + Firestore로 체크·메모 공유
// 허용된 계정만 읽고 쓸 수 있도록 firestore.rules 에서 막는다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 웹 앱 공개 설정값 (비밀 아님 — 접근은 로그인과 보안 규칙이 막음)
const firebaseConfig = {
  apiKey: "AIzaSyA_gnW8BLonx0FtCz1k_0njWNK6Bb8--jA",
  authDomain: "us-west-roadtrip-2026.firebaseapp.com",
  projectId: "us-west-roadtrip-2026",
  storageBucket: "us-west-roadtrip-2026.firebasestorage.app",
  messagingSenderId: "70679803716",
  appId: "1:70679803716:web:dda900391ceb5d316e8911"
};

const T = window.TRIP;
const bar = document.getElementById("authbar");

if (T && bar && !window.claude) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const fs = getFirestore(app);
  let unsubs = [];

  const stopSync = () => { unsubs.forEach(u => u()); unsubs = []; };

  // 예약번호: 공개 페이지에는 없고, 허용된 계정으로 로그인하면 Firestore private/bookings 에서 불러옴
  const secrets = document.querySelectorAll(".secret[data-secret]");
  const hideSecrets = () => secrets.forEach(el => { el.textContent = "로그인하면 보임"; el.classList.remove("shown"); });
  const showSecrets = async () => {
    try {
      const snap = await getDoc(doc(fs, "private", "bookings"));
      const data = snap.exists() ? snap.data() : {};
      secrets.forEach(el => {
        const v = data[el.dataset.secret];
        if (typeof v === "string" && v) { el.textContent = v; el.classList.add("shown"); }
        else { el.textContent = "(미등록)"; }
      });
    } catch (e) { hideSecrets(); }
  };

  const denied = (email) => {
    stopSync();
    hideSecrets();
    T.dropRemote();
    T.setStatus(`${email} 계정은 공유 권한이 없어요. 체크·메모는 이 기기에만 저장돼요.`, false);
  };

  const renderSignedOut = () => {
    bar.hidden = false;
    bar.innerHTML = `<button type="button" class="primary" id="signin">Google로 로그인</button>
      <span>로그인하면 체크·메모가 둘이 같이 저장돼요.</span>`;
    document.getElementById("signin").addEventListener("click", async () => {
      try { await signInWithPopup(auth, new GoogleAuthProvider()); }
      catch (e) {
        if (e && e.code === "auth/popup-closed-by-user") return;
        T.setStatus("로그인하지 못했어요. 팝업 차단을 풀고 다시 시도하세요.", false);
      }
    });
  };

  const renderSignedIn = (user) => {
    bar.hidden = false;
    bar.innerHTML = `<span><b></b> 로그인됨</span><button type="button" id="signout">로그아웃</button>`;
    bar.querySelector("b").textContent = user.email || "";
    document.getElementById("signout").addEventListener("click", () => signOut(auth));
  };

  onAuthStateChanged(auth, (user) => {
    stopSync();
    if (!user) {
      hideSecrets();
      T.dropRemote();
      T.setStatus("체크·메모는 이 기기에만 저장돼요.", false);
      renderSignedOut();
      return;
    }
    renderSignedIn(user);
    showSecrets();
    T.useRemote({
      setCheck: (id, done) => setDoc(doc(fs, "checks", id), { done, by: user.email, at: Date.now() }),
      setMemo: (day, text) => setDoc(doc(fs, "memos", day), { text, by: user.email, at: Date.now() })
    });
    T.setStatus("체크·메모는 공유돼서 같이 보는 사람에게 실시간으로 보여요.", true);
    const onErr = (e) => { if (e && e.code === "permission-denied") denied(user.email); };
    unsubs.push(onSnapshot(collection(fs, "checks"), (snap) => {
      snap.docs.forEach(d => T.applyCheck(d.id, d.data().done));
    }, onErr));
    unsubs.push(onSnapshot(collection(fs, "memos"), (snap) => {
      snap.docs.forEach(d => T.applyMemo(d.id, d.data().text));
    }, onErr));
  });
}
