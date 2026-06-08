/* ============================================================
   VERITUS ENGENHARIA — Home Dashboard
   Stats dinâmicos, gráficos CSS e viagens demo.
   ============================================================ */

(function () {
  'use strict';

  // ── Referências DOM ─────────────────────────────────────────

  var statViagens   = document.querySelector('#stat-viagens .stat-card__value');
  var statCaminhoes = document.querySelector('#stat-caminhoes .stat-card__value');
  var statEficiencia = document.querySelector('#stat-eficiencia .stat-card__value');
  var chartProdutividade = document.getElementById('chart-produtividade');
  var chartDesempenho    = document.getElementById('chart-desempenho');
  var headerName  = document.querySelector('.top-header__name');

  // ── Atualizar Operador ──────────────────────────────────────

  if (headerName) {
    headerName.textContent = VeritusStore.getOperador();
  }

  // ── Atualizar Stats ─────────────────────────────────────────

  function updateStats() {
    var today = VeritusStore.getToday();
    var stats = VeritusStore.getStats(today);

    if (statViagens)   statViagens.textContent = stats.totalViagens;
    if (statCaminhoes) statCaminhoes.textContent = stats.totalTrucks;
    if (statEficiencia) statEficiencia.textContent = stats.eficiencia + '%';
  }

  // ── Gráfico de Produtividade (Barras CSS) ───────────────────

  function renderChartProdutividade() {
    var today = VeritusStore.getToday();
    var truckStats = VeritusStore.getTruckStats(today);

    if (!chartProdutividade) return;

    // Preservar header
    var header = chartProdutividade.querySelector('.chart-section__header');
    chartProdutividade.innerHTML = '';
    if (header) chartProdutividade.appendChild(header);

    if (truckStats.length === 0) {
      var emptyDiv = document.createElement('div');
      emptyDiv.className = 'chart-placeholder';
      emptyDiv.innerHTML = '<svg class="chart-placeholder__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><p class="chart-placeholder__text">Nenhum dado disponível</p>';
      chartProdutividade.appendChild(emptyDiv);
      return;
    }

    var maxViagens = Math.max.apply(null, truckStats.map(function (t) { return t.viagens; }));
    var barsContainer = document.createElement('div');
    barsContainer.className = 'css-chart';

    truckStats.forEach(function (truck, index) {
      var percentage = maxViagens > 0 ? (truck.viagens / maxViagens) * 100 : 0;
      var colors = ['var(--accent-primary)', 'var(--accent-info)', 'var(--accent-success)', 'var(--accent-purple)'];
      var color = colors[index % colors.length];

      var barRow = document.createElement('div');
      barRow.className = 'css-chart__row';
      barRow.innerHTML =
        '<span class="css-chart__label">' + truck.truck + '</span>' +
        '<div class="css-chart__bar-bg">' +
          '<div class="css-chart__bar" style="width: ' + percentage + '%; background: ' + color + '; animation-delay: ' + (index * 0.1) + 's;"></div>' +
        '</div>' +
        '<span class="css-chart__value">' + truck.viagens + '</span>';
      barsContainer.appendChild(barRow);
    });

    chartProdutividade.appendChild(barsContainer);
  }

  // ── Desempenho Individual ───────────────────────────────────

  function renderDesempenho() {
    var today = VeritusStore.getToday();
    var truckStats = VeritusStore.getTruckStats(today);

    if (!chartDesempenho) return;

    var header = chartDesempenho.querySelector('.chart-section__header');
    chartDesempenho.innerHTML = '';
    if (header) chartDesempenho.appendChild(header);

    if (truckStats.length === 0) {
      var emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = '<svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p class="empty-state__text">Escaneie viagens para ver dados</p>';
      chartDesempenho.appendChild(emptyDiv);
      return;
    }

    var listDiv = document.createElement('div');
    listDiv.className = 'truck-performance-list';

    truckStats.forEach(function (truck) {
      var lastTime = new Date(truck.ultima).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      var item = document.createElement('div');
      item.className = 'truck-performance-item';
      item.innerHTML =
        '<div class="truck-performance-item__info">' +
          '<span class="truck-performance-item__plate">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 9H12"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>' +
            truck.truck +
          '</span>' +
          '<span class="truck-performance-item__time">Última: ' + lastTime + '</span>' +
        '</div>' +
        '<div class="truck-performance-item__count">' +
          '<span class="truck-performance-item__number">' + truck.viagens + '</span>' +
          '<span class="truck-performance-item__label">viagen' + (truck.viagens === 1 ? '' : 's') + '</span>' +
        '</div>';
      listDiv.appendChild(item);
    });

    chartDesempenho.appendChild(listDiv);
  }



  // ── Init ────────────────────────────────────────────────────

  updateStats();
  renderChartProdutividade();
  renderDesempenho();

  // Escutar atualizações em tempo real do Firestore
  document.addEventListener('veritus-data-updated', function () {
    updateStats();
    renderChartProdutividade();
    renderDesempenho();
  });

  // Auto-refresh a cada 30 segundos
  setInterval(function () {
    updateStats();
    renderChartProdutividade();
    renderDesempenho();
  }, 30000);

})();
