/* ============================================================
   VERITUS ENGENHARIA — Histórico Dinâmico
   Renderiza viagens filtradas por data, com date picker.
   ============================================================ */

(function () {
  'use strict';

  var datePicker      = document.getElementById('date-picker-historico');
  var dateValue       = datePicker ? datePicker.querySelector('.date-picker__value') : null;
  var badgeViagens    = document.getElementById('badge-viagens');
  var historicoList   = document.getElementById('historico-list');
  var hiddenDateInput = document.getElementById('hidden-date-historico');

  var currentDate = VeritusStore.getToday();

  // ── Renderizar Viagens ──────────────────────────────────────

  function renderViagens() {
    var viagens = VeritusStore.getViagensByDate(currentDate);

    // Atualizar badge
    if (badgeViagens) {
      badgeViagens.textContent = viagens.length + ' viagen' + (viagens.length === 1 ? '' : 's');
    }

    // Atualizar data exibida
    if (dateValue) {
      dateValue.textContent = VeritusStore.formatDateBR(currentDate);
    }

    // Limpar e renderizar lista
    if (!historicoList) return;
    historicoList.innerHTML = '';

    if (viagens.length === 0) {
      historicoList.innerHTML =
        '<div class="empty-state">' +
          '<svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          '<p class="empty-state__text">Nenhuma viagem registrada nesta data</p>' +
        '</div>';
      return;
    }

    // Renderizar cada viagem como card
    viagens.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    viagens.forEach(function (viagem, index) {
      var time = new Date(viagem.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      var card = document.createElement('div');
      card.className = 'viagem-card';
      card.style.animationDelay = (index * 0.05) + 's';
      card.innerHTML =
        '<div class="viagem-card__header">' +
          '<div class="viagem-card__plate">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 9H12"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>' +
            '<span>' + viagem.truck + '</span>' +
          '</div>' +
          '<span class="viagem-card__time">' + time + '</span>' +
        '</div>' +
        '<div class="viagem-card__body">' +
          '<div class="viagem-card__row">' +
            '<span class="viagem-card__label">Corte</span>' +
            '<span class="viagem-card__value">' + viagem.corte + '</span>' +
          '</div>' +
          '<div class="viagem-card__row">' +
            '<span class="viagem-card__label">Aterro</span>' +
            '<span class="viagem-card__value">' + viagem.aterro + '</span>' +
          '</div>' +
          (viagem.carga ? '<div class="viagem-card__row"><span class="viagem-card__label">Carga</span><span class="viagem-card__value">' + viagem.carga + '</span></div>' : '') +
        '</div>';
      historicoList.appendChild(card);
    });
  }

  // ── Date Picker ─────────────────────────────────────────────

  if (datePicker && hiddenDateInput) {
    datePicker.addEventListener('click', function () {
      hiddenDateInput.showPicker ? hiddenDateInput.showPicker() : hiddenDateInput.click();
    });

    hiddenDateInput.value = currentDate;

    hiddenDateInput.addEventListener('change', function () {
      currentDate = this.value;
      renderViagens();
    });
  }

  // ── Init ────────────────────────────────────────────────────

  renderViagens();

  // Escutar atualizações em tempo real do Firestore
  document.addEventListener('veritus-data-updated', function () {
    renderViagens();
  });

})();
