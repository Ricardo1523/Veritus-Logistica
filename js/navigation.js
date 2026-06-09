/* ============================================================
   VERITUS ENGENHARIA — Navegação
   Marca o item ativo no bottom nav baseado na página atual.
   Controle de acesso por perfil: admin, operador, motorista.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // Identifica a página atual pelo nome do arquivo
  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  // ── GUARDS DE ACESSO ─────────────────────────────────────────
  var operador = localStorage.getItem('veritus_operador');
  var role = localStorage.getItem('veritus_role') || 'operador';

  // Se não estiver logado, redireciona para a página de login
  if (!operador && page !== 'index.html') {
    window.location.href = 'index.html';
    return;
  }

  // Se for motorista, só pode acessar gerar-qr.html
  if (role === 'motorista' && page !== 'gerar-qr.html' && page !== 'index.html') {
    window.location.href = 'gerar-qr.html';
    return;
  }

  // Se não for admin, não pode acessar usuarios.html nem relatorios.html
  if (role !== 'admin' && page === 'usuarios.html') {
    window.location.href = 'home.html';
    return;
  }
  if (role === 'operador' && page === 'relatorios.html') {
    window.location.href = 'home.html';
    return;
  }

  // ── CONFIGURAÇÃO DE NAVEGAÇÃO ────────────────────────────────

  var bottomNav = document.getElementById('bottom-nav');

  // Ocultar aba "Relatórios" para operador (não tem permissão)
  if (role === 'operador' && bottomNav) {
    var relatoriosNav = document.getElementById('nav-relatorios');
    if (relatoriosNav) {
      relatoriosNav.style.display = 'none';
    }
  }

  // Ocultar botão de Relatórios na home para operador
  if (role === 'operador') {
    var btnRelatoriosHome = document.getElementById('btn-relatorios');
    if (btnRelatoriosHome) {
      btnRelatoriosHome.style.display = 'none';
    }
  }

  // Injetar aba "Usuários" dinamicamente para Administrador
  if (role === 'admin' && bottomNav && !document.getElementById('nav-usuarios')) {
    var userLink = document.createElement('a');
    userLink.href = 'usuarios.html';
    userLink.className = 'bottom-nav__item';
    userLink.id = 'nav-usuarios';
    userLink.innerHTML = `
      <svg class="bottom-nav__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span class="bottom-nav__label">Usuários</span>
    `;
    bottomNav.appendChild(userLink);
  }

  // Mapeamento de página → id do nav item
  var navMap = {
    'home.html':       'nav-inicio',
    'scanner.html':    'nav-scanner',
    'historico.html':  'nav-historico',
    'relatorios.html': 'nav-relatorios',
    'gerar-qr.html':   'nav-gerar-qr',
    'usuarios.html':   'nav-usuarios'
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

  // ── LOGOUT GLOBAL ────────────────────────────────────────────
  var btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function (e) {
      e.preventDefault();
      
      var doLogout = function () {
        localStorage.removeItem('veritus_operador');
        localStorage.removeItem('veritus_role');
        window.location.href = 'index.html';
      };

      if (typeof auth !== 'undefined') {
        auth.signOut()
          .then(doLogout)
          .catch(function (err) {
            console.error('[Logout] Erro ao deslogar do Firebase:', err);
            doLogout();
          });
      } else {
        doLogout();
      }
    });
  }
});
