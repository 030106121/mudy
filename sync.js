/* MUDY 실시간 연동 — Firebase Realtime Database, 실패 시 같은 기기 로컬 모드 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBaGMzMazhTvDnAEV1dPl_swtoL057QK3g",
  authDomain: "industrial-design-ca213.firebaseapp.com",
  databaseURL: "https://industrial-design-ca213-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "industrial-design-ca213",
  storageBucket: "industrial-design-ca213.firebasestorage.app",
  messagingSenderId: "643113739198",
  appId: "1:643113739198:web:a2c64b0294711f09444fef"
};

window.MudySync = (function(){
  const forceLocal = /[?&]local=1/.test(location.search);

  function firebaseBackend(){
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.database();
    const root = db.ref('mudy/requests');
    return {
      mode: 'firebase',
      onRequests(cb){ root.on('value', s => cb(s.val() || {})); },
      onRequest(id, cb){ root.child(id).on('value', s => cb(s.val())); },
      create(data){ const r = root.push(); r.set(Object.assign({}, data, { createdAt: firebase.database.ServerValue.TIMESTAMP })); return r.key; },
      update(id, patch){ return root.child(id).update(Object.assign({}, patch, { updatedAt: firebase.database.ServerValue.TIMESTAMP })); },
      clearAll(){ return root.remove(); },
      onConn(cb){ db.ref('.info/connected').on('value', s => cb(!!s.val())); }
    };
  }

  function localBackend(){
    const KEY = 'mudy_local_requests';
    let bc = null; try { bc = new BroadcastChannel('mudy'); } catch(e){}
    const subs = [], one = [];
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return mem; } };
    let mem = {};
    const write = d => { mem = d; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){} emit(); bc && bc.postMessage('x'); };
    const emit = () => { const d = read(); subs.forEach(f => f(d)); one.forEach(([id,f]) => f(d[id] || null)); };
    bc && (bc.onmessage = emit);
    addEventListener('storage', e => { if (e.key === KEY) emit(); });
    return {
      mode: 'local',
      onRequests(cb){ subs.push(cb); cb(read()); },
      onRequest(id, cb){ one.push([id, cb]); cb(read()[id] || null); },
      create(data){ const d = read(); const id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); d[id] = Object.assign({}, data, { createdAt: Date.now() }); write(d); return id; },
      update(id, patch){ const d = read(); if (d[id]) { Object.assign(d[id], patch, { updatedAt: Date.now() }); write(d); } return Promise.resolve(); },
      clearAll(){ write({}); return Promise.resolve(); },
      onConn(cb){ cb(true); }
    };
  }

  try {
    if (!forceLocal && window.firebase && FIREBASE_CONFIG.databaseURL) return firebaseBackend();
  } catch(e){ console.warn('Firebase 연결 실패, 로컬 모드로 전환', e); }
  return localBackend();
})();

/* 공통 상수 — 신호 체계 UX-1a */
window.MUDY = {
  STEPS: ['접수','접근','도착·준비','끌어내기','완료'],
  VOICE: [
    ['밴드', '요청이 접수됐어요. 움직이지 말고 기다려 주세요'],
    ['밴드', '머디가 오고 있어요'],
    ['머디', '제가 도와드릴게요. 다리 주변에 물을 뿌릴게요'],
    ['머디', '손잡이를 잡고 계세요'],
    ['머디', '안전한 곳에 도착했어요']
  ],
  EX_VOICE: {
    '2': ['밴드', '신호를 찾고 있어요. 다시 누르지 않아도 돼요'],
    '4': ['밴드', '구조대원이 직접 오고 있어요'],
    '5': ['머디', '천천히 다시 잡아 주세요']
  }
};
