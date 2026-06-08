/* ============================================================
   VERITUS ENGENHARIA — Relatórios de Produção
   Tabela dinâmica + Exportação Excel via SheetJS.
   ============================================================ */

(function () {
  'use strict';

  var datePicker     = document.getElementById('date-picker-relatorios');
  var datePickerVal  = datePicker ? datePicker.querySelector('.date-picker__value') : null;
  var hiddenDate     = document.getElementById('hidden-date-relatorios');
  var statTotal      = document.querySelector('#stat-total-viagens .stat-card__value');
  var statCaminhoes  = document.querySelector('#stat-caminhoes-ativos .stat-card__value');
  var relatoriosTable = document.getElementById('relatorios-table');
  var btnExportar    = document.getElementById('btn-exportar-excel');
  var btnEmail       = document.getElementById('btn-enviar-email');

  var currentDate = VeritusStore.getToday();

  // ── Atualizar Stats ─────────────────────────────────────────

  function updateStats() {
    var stats = VeritusStore.getStats(currentDate);
    if (statTotal)     statTotal.textContent = stats.totalViagens;
    if (statCaminhoes) statCaminhoes.textContent = stats.totalTrucks;
  }

  // ── Renderizar Tabela ───────────────────────────────────────

  function renderTable() {
    var viagens = VeritusStore.getViagensByDate(currentDate);

    if (!relatoriosTable) return;
    relatoriosTable.innerHTML = '';

    // Atualizar data exibida
    if (datePickerVal) {
      datePickerVal.textContent = VeritusStore.formatDateBR(currentDate);
    }

    if (viagens.length === 0) {
      relatoriosTable.innerHTML =
        '<div class="empty-state">' +
          '<svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12H8"/><path d="M16 16H8"/><path d="M16 12h-2"/></svg>' +
          '<p class="empty-state__text">Nenhuma viagem registrada para ' + VeritusStore.formatDateBR(currentDate) + '</p>' +
        '</div>';
      return;
    }

    // Criar tabela
    var table = document.createElement('table');
    table.className = 'data-table';

    // Header
    var thead = document.createElement('thead');
    thead.innerHTML =
      '<tr>' +
        '<th>Placa</th>' +
        '<th>Corte</th>' +
        '<th>Aterro</th>' +
        '<th>Hora</th>' +
      '</tr>';
    table.appendChild(thead);

    // Body
    var tbody = document.createElement('tbody');
    viagens.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    viagens.forEach(function (v) {
      var time = new Date(v.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="data-table__plate">' + v.truck + '</span></td>' +
        '<td>' + v.corte + '</td>' +
        '<td>' + v.aterro + '</td>' +
        '<td>' + time + '</td>';
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    // Wrapper responsivo
    var wrapper = document.createElement('div');
    wrapper.className = 'data-table__wrapper';
    wrapper.appendChild(table);
    relatoriosTable.appendChild(wrapper);
  }

  // ── Exportar Excel ──────────────────────────────────────────

  function exportarExcel() {
    if (typeof XLSX === 'undefined') {
      VeritusUI.showToast('⚠️ Biblioteca de exportação não carregada.', 'warning');
      return;
    }

    var data = VeritusStore.exportData(currentDate);
    if (data.length === 0) {
      VeritusUI.showToast('⚠️ Nenhuma viagem para exportar nesta data.', 'warning');
      return;
    }

    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

    // Auto-width das colunas
    var colWidths = Object.keys(data[0]).map(function (key) {
      var maxLen = key.length;
      data.forEach(function (row) {
        var val = String(row[key] || '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 2 };
    });
    ws['!cols'] = colWidths;

    var dateStr = VeritusStore.formatDateBR(currentDate).replace(/\//g, '-');
    XLSX.writeFile(wb, 'Veritus_Relatorio_' + dateStr + '.xlsx');

    VeritusUI.showToast('✅ Relatório Excel exportado com sucesso!', 'success');
  }

  // ── Enviar Email ────────────────────────────────────────────

  function enviarEmail() {
    var data = VeritusStore.exportData(currentDate);
    if (data.length === 0) {
      VeritusUI.showToast('⚠️ Nenhuma viagem para enviar nesta data.', 'warning');
      return;
    }

    var dateStr = VeritusStore.formatDateBR(currentDate);
    var subject = 'Veritus Engenharia - Relatório de Produção ' + dateStr;
    var body = 'Relatório de Produção - ' + dateStr + '\n\n';
    body += 'Total de viagens: ' + data.length + '\n\n';

    data.forEach(function (row, i) {
      body += (i + 1) + '. ' + row.Placa + ' | ' + row.Corte + ' → ' + row.Aterro + ' | ' + row.Hora + '\n';
    });

    body += '\n---\nGerado pelo Sistema Veritus Engenharia';

    var mailto = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = mailto;

    VeritusUI.showToast('📧 Abrindo cliente de email...', 'info');
  }

  // ── Date Picker ─────────────────────────────────────────────

  if (datePicker && hiddenDate) {
    datePicker.addEventListener('click', function () {
      hiddenDate.showPicker ? hiddenDate.showPicker() : hiddenDate.click();
    });

    hiddenDate.value = currentDate;

    hiddenDate.addEventListener('change', function () {
      currentDate = this.value;
      updateStats();
      renderTable();
    });
  }

  // ── Event Listeners ─────────────────────────────────────────

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarExcel);
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', enviarEmail);
  }

  // ── Init ────────────────────────────────────────────────────

  updateStats();
  renderTable();

  // Escutar atualizações em tempo real do Firestore
  document.addEventListener('veritus-data-updated', function () {
    updateStats();
    renderTable();
  });

})();
