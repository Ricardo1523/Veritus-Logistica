/* ============================================================
   VERITUS ENGENHARIA — Registro do PWA
   ============================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (registration) {
        console.log('ServiceWorker registrado com sucesso! Escopo:', registration.scope);

        // Verifica atualizações do Service Worker
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível! Se o objeto 'ui' estiver disponível, exibe toast
              if (window.ui && typeof window.ui.showToast === 'function') {
                window.ui.showToast('Nova versão disponível! Reinicie para atualizar.', 'info');
              } else {
                console.log('Nova versão disponível! Recarregue a página.');
              }
            }
          });
        });
      })
      .catch(function (error) {
        console.error('Falha ao registrar o ServiceWorker:', error);
      });
  });
}
