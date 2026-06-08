/* ============================================================
   VERITUS ENGENHARIA — Gerador de QR Code
   Gera QR Code com dados do veículo usando qrcode.js.
   ============================================================ */

(function () {
  'use strict';

  var form        = document.getElementById('form-gerar-qr');
  var btnGerar    = document.getElementById('btn-gerar-qr');
  var qrDisplay   = document.getElementById('qr-display');
  var inputPlaca  = document.getElementById('placa');
  var inputCorte  = document.getElementById('corte');
  var inputAterro = document.getElementById('aterro');
  var inputCarga  = document.getElementById('carga');

  var currentQR = null;

  // ── Gerar QR Code ───────────────────────────────────────────

  function gerarQR() {
    var placa  = (inputPlaca.value || '').trim().toUpperCase();
    var corte  = (inputCorte.value || '').trim();
    var aterro = (inputAterro.value || '').trim();
    var carga  = (inputCarga.value || '').trim();

    // Validação
    if (!placa) {
      VeritusUI.showToast('⚠️ Informe a placa do veículo.', 'warning');
      inputPlaca.focus();
      return;
    }

    if (!corte) {
      VeritusUI.showToast('⚠️ Informe o tipo de corte.', 'warning');
      inputCorte.focus();
      return;
    }

    if (!aterro) {
      VeritusUI.showToast('⚠️ Informe o aterro de destino.', 'warning');
      inputAterro.focus();
      return;
    }

    // Dados do QR em JSON
    var data = JSON.stringify({
      truck: placa,
      corte: corte,
      aterro: aterro,
      carga: carga
    });

    // Limpar display anterior
    qrDisplay.innerHTML = '';

    // Container do QR
    var qrContainer = document.createElement('div');
    qrContainer.className = 'qr-display__image';
    qrContainer.id = 'qr-canvas';
    qrDisplay.appendChild(qrContainer);

    // Gerar QR Code
    if (typeof QRCode !== 'undefined') {
      currentQR = new QRCode(qrContainer, {
        text: data,
        width: 200,
        height: 200,
        colorDark: '#0f1724',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrContainer.innerHTML = '<p style="color: var(--text-muted);">Biblioteca QR não carregada.</p>';
      return;
    }

    // Info do QR gerado
    var infoDiv = document.createElement('div');
    infoDiv.className = 'qr-display__info';
    infoDiv.innerHTML =
      '<p class="qr-display__plate">' + placa + '</p>' +
      '<p class="qr-display__details">' + corte + ' → ' + aterro + '</p>' +
      (carga ? '<p class="qr-display__details">' + carga + '</p>' : '');
    qrDisplay.appendChild(infoDiv);

    // Botão de download
    var downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn--outline btn--full';
    downloadBtn.type = 'button';
    downloadBtn.id = 'btn-download-qr';
    downloadBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
      ' Baixar QR Code';
    downloadBtn.addEventListener('click', function () {
      downloadQR(placa);
    });
    qrDisplay.appendChild(downloadBtn);

    VeritusUI.showToast('✅ QR Code gerado com sucesso!', 'success');
  }

  // ── Download do QR ──────────────────────────────────────────

  function downloadQR(placa) {
    var canvas = document.querySelector('#qr-canvas canvas');
    if (!canvas) {
      // Tentar img (qrcode.js pode gerar table ou canvas)
      var img = document.querySelector('#qr-canvas img');
      if (img) {
        var link = document.createElement('a');
        link.download = 'QR_' + placa + '.png';
        link.href = img.src;
        link.click();
        return;
      }
      VeritusUI.showToast('⚠️ Não foi possível baixar o QR Code.', 'warning');
      return;
    }

    var link = document.createElement('a');
    link.download = 'QR_' + placa + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ── Event Listeners ─────────────────────────────────────────

  if (btnGerar) {
    btnGerar.addEventListener('click', function (e) {
      e.preventDefault();
      gerarQR();
    });
  }

  // Máscara da placa (uppercase)
  if (inputPlaca) {
    inputPlaca.addEventListener('input', function () {
      this.value = this.value.toUpperCase();
    });
  }

})();
