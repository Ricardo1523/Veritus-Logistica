/* ============================================================
   VERITUS ENGENHARIA — Navegação
   Marca o item ativo no bottom nav baseado na página atual.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // Identifica a página atual pelo nome do arquivo
  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  // Mapeamento de página → id do nav item
  var navMap = {
    'home.html':       'nav-inicio',
    'scanner.html':    'nav-scanner',
    'historico.html':  'nav-historico',
    'relatorios.html': 'nav-relatorios',
    'gerar-qr.html':  'nav-gerar-qr'
  };

  var activeId = navMap[page];
  if (!activeId) return;

  // Remove active de todos e aplica no correto
  var items = document.querySelectorAll('.bottom-nav__item');
  items.forEach(function (item) {
    item.classList.remove('bottom-nav__item--active');
  });

  var activeItem = document.getElementById(activeId);
  if (activeItem) {
    activeItem.classList.add('bottom-nav__item--active');
  }
});
