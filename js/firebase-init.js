/* ============================================================
   VERITUS ENGENHARIA — Inicialização do Firebase
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCJFFENIHnN6xewOgz3i7rSaxOKFs9bXcg",
  authDomain: "veritus-engenharia.firebaseapp.com",
  projectId: "veritus-engenharia",
  storageBucket: "veritus-engenharia.firebasestorage.app",
  messagingSenderId: "712007417311",
  appId: "1:712007417311:web:0ca0f3a6b5b6e4a084986a"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Ativar persistência offline (IndexedDB) para funcionamento offline do PWA
db.enablePersistence({ synchronizeTabs: true })
  .then(function () {
    console.log('[Firestore] Persistência offline ativada com sucesso.');
  })
  .catch(function (err) {
    if (err.code == 'failed-precondition') {
      console.warn('[Firestore] Persistência offline falhou: múltiplas abas abertas.');
    } else if (err.code == 'unimplemented') {
      console.warn('[Firestore] Persistência offline não suportada pelo navegador.');
    } else {
      console.error('[Firestore] Erro de persistência offline:', err);
    }
  });
