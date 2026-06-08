/* ============================================================
   VERITUS ENGENHARIA — Scanner QR Code
   Leitura de QR Code com câmera real via html5-qrcode.
   ============================================================ */

(function () {
  'use strict';

  var scannerPreview = document.getElementById('scanner-preview');
  var scannerArea    = document.getElementById('scanner-area');
  var btnAtivar      = document.getElementById('btn-ativar-camera');
  var infoFormatos   = document.getElementById('info-formatos');

  var html5QrScanner = null;
  var isScanning = false;

  // ── Parsear dados do QR Code ────────────────────────────────

  function parseQRData(text) {
    text = text.trim();

    // Tentar JSON: {"truck":"...","corte":"...","aterro":"...","carga":"..."}
    try {
      var json = JSON.parse(text);
      if (json.truck) {
        return {
          truck: json.truck || '',
          corte: json.corte || '',
          aterro: json.aterro || '',
          carga: json.carga || ''
        };
      }
    } catch (e) {
      // Não é JSON, tentar formato texto
    }

    // Formato texto: CAMINHÃO|CORTE|ATERRO|CARGA
    var parts = text.split('|');
    if (parts.length >= 3) {
      return {
        truck: parts[0] || '',
        corte: parts[1] || '',
        aterro: parts[2] || '',
        carga: parts[3] || ''
      };
    }

    return null;
  }

  // ── Callback de sucesso ─────────────────────────────────────

  function onScanSuccess(decodedText) {
    var data = parseQRData(decodedText);

    if (!data) {
      VeritusUI.showToast('⚠️ QR Code não reconhecido. Use formato JSON ou PIPE.', 'warning');
      return;
    }

    // Pausar scanner
    if (html5QrScanner) {
      html5QrScanner.pause(true);
    }

    // Mostrar modal de confirmação
    VeritusUI.showModal({
      title: 'Viagem Detectada',
      icon: 'truck',
      fields: [
        { label: 'Placa', value: data.truck },
        { label: 'Corte', value: data.corte },
        { label: 'Aterro', value: data.aterro },
        { label: 'Carga', value: data.carga }
      ],
      confirmText: 'Registrar Viagem',
      cancelText: 'Cancelar',
      onConfirm: function () {
        var viagem = VeritusStore.addViagem(data);
        var time = new Date(viagem.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        VeritusUI.showToast('✅ Viagem registrada — ' + viagem.truck + ' às ' + time, 'success');

        // Retomar scanner após 1.5s
        setTimeout(function () {
          if (html5QrScanner && isScanning) {
            html5QrScanner.resume();
          }
        }, 1500);
      },
      onCancel: function () {
        // Retomar scanner
        if (html5QrScanner && isScanning) {
          html5QrScanner.resume();
        }
      }
    });
  }

  // ── Iniciar Scanner ─────────────────────────────────────────

  function startScanner() {
    if (typeof Html5Qrcode === 'undefined') {
      VeritusUI.showToast('⚠️ Biblioteca de scanner não carregada. Verifique sua conexão.', 'warning');
      return;
    }

    // Trocar preview estático pelo container da câmera
    scannerPreview.innerHTML = '<div id="qr-reader" style="width: 100%;"></div>';
    scannerPreview.style.border = 'none';
    scannerPreview.style.padding = '0';

    html5QrScanner = new Html5Qrcode('qr-reader');

    var config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    html5QrScanner.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      function () { /* Ignore scan errors (frames without QR) */ }
    ).then(function () {
      isScanning = true;
      btnAtivar.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>' +
        ' Parar Câmera';
      btnAtivar.classList.remove('btn--primary');
      btnAtivar.classList.add('btn--danger');
    }).catch(function (err) {
      console.error('[Scanner] Erro ao iniciar câmera:', err);
      scannerPreview.innerHTML =
        '<svg class="scanner-preview__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
        '<p class="scanner-preview__title">Câmera indisponível</p>' +
        '<p class="scanner-preview__text">Permita o acesso à câmera ou use outro dispositivo.</p>';
      scannerPreview.style.border = '2px dashed var(--border-dashed)';
      scannerPreview.style.padding = 'var(--space-8)';
      VeritusUI.showToast('❌ Não foi possível acessar a câmera.', 'error');
    });
  }

  // ── Parar Scanner ───────────────────────────────────────────

  function stopScanner() {
    if (html5QrScanner) {
      html5QrScanner.stop().then(function () {
        isScanning = false;
        html5QrScanner = null;

        scannerPreview.style.border = '2px dashed var(--border-dashed)';
        scannerPreview.style.padding = 'var(--space-8)';
        scannerPreview.innerHTML =
          '<svg class="scanner-preview__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' +
          '<p class="scanner-preview__title">Pronto para escanear</p>' +
          '<p class="scanner-preview__text">Clique no botão abaixo para ativar a câmera</p>';

        btnAtivar.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' +
          ' Ativar Câmera';
        btnAtivar.classList.remove('btn--danger');
        btnAtivar.classList.add('btn--primary');
      });
    }
  }

  // ── Event Listeners ─────────────────────────────────────────

  if (btnAtivar) {
    btnAtivar.addEventListener('click', function () {
      if (isScanning) {
        stopScanner();
      } else {
        startScanner();
      }
    });
  }



})();
