/* ============================================================
   VERITUS ENGENHARIA — Gerenciamento de Usuários
   CRUD de contas com técnica de registro por app secundário.
   ============================================================ */

(function () {
  'use strict';

  var formUser          = document.getElementById('create-user-form');
  var btnCriar          = document.getElementById('btn-criar-usuario');
  var inputNome         = document.getElementById('user-nome');
  var inputOperador     = document.getElementById('user-operador');
  var inputSenha        = document.getElementById('user-senha');
  var selectPerfil      = document.getElementById('user-perfil');
  var listContainer     = document.getElementById('usuarios-list-container');

  var isOfflineMode = localStorage.getItem('veritus_offline') === 'true';
  var isFirebaseEnabled = typeof auth !== 'undefined' && typeof db !== 'undefined' && !isOfflineMode;

  // ── RENDERIZAR TABELA DE USUÁRIOS ───────────────────────────

  function renderUsers() {
    if (isFirebaseEnabled) {
      listContainer.innerHTML = '<div class="empty-state"><p class="empty-state__text">Carregando usuários do servidor...</p></div>';
      
      db.collection('usuarios').get()
        .then(function (querySnapshot) {
          var users = [];
          querySnapshot.forEach(function (doc) {
            var data = doc.data();
            data.uid = doc.id;
            users.push(data);
          });
          buildTable(users);
        })
        .catch(function (error) {
          console.error('[Usuarios] Erro ao carregar usuários:', error);
          listContainer.innerHTML = '<div class="empty-state"><p class="empty-state__text">Erro ao conectar com a base de dados.</p></div>';
        });
    } else {
      // Fallback local (offline)
      var localUsers = JSON.parse(localStorage.getItem('veritus_usuarios') || '[]');
      if (localUsers.length === 0) {
        // Se vazio, seed o admin padrão
        localUsers.push({
          uid: 'local_admin',
          displayName: 'Administrador Geral',
          usuario: 'admin',
          role: 'admin'
        });
        localStorage.setItem('veritus_usuarios', JSON.stringify(localUsers));
      }
      buildTable(localUsers);
    }
  }

  function getRoleBadge(role) {
    if (role === 'admin') return '<span class="status-badge status-badge--warning">Administrador</span>';
    if (role === 'motorista') return '<span class="status-badge status-badge--success">Motorista</span>';
    return '<span class="status-badge status-badge--info">Operador</span>';
  }

  function buildTable(users) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (users.length === 0) {
      listContainer.innerHTML = '<div class="empty-state"><p class="empty-state__text">Nenhum usuário cadastrado.</p></div>';
      return;
    }

    var table = document.createElement('table');
    table.className = 'data-table';

    // Header
    var thead = document.createElement('thead');
    thead.innerHTML =
      '<tr>' +
        '<th>Nome</th>' +
        '<th>ID/Login</th>' +
        '<th>Perfil</th>' +
        '<th style="text-align: right;">Ação</th>' +
      '</tr>';
    table.appendChild(thead);

    // Body
    var tbody = document.createElement('tbody');
    users.forEach(function (user) {
      var tr = document.createElement('tr');
      
      // Sanitizar ID e Email para exibir apenas o login
      var loginShow = user.usuario || (user.email ? user.email.split('@')[0] : '—');
      
      // Botão desativar (não permite desativar a si mesmo)
      var currentOperador = VeritusStore.getOperador();
      var isSelf = (user.displayName === currentOperador || user.uid === 'local_admin');
      
      var actionBtn = '';
      if (!isSelf) {
        actionBtn = '<button class="btn btn--outline btn--sm btn-deactivate" data-uid="' + user.uid + '" data-name="' + user.displayName + '" type="button">Desativar</button>';
      } else {
        actionBtn = '<span style="color: var(--text-muted); font-size: var(--font-size-xs);">Sessão Ativa</span>';
      }

      tr.innerHTML =
        '<td>' + user.displayName + '</td>' +
        '<td><code>' + loginShow + '</code></td>' +
        '<td>' + getRoleBadge(user.role) + '</td>' +
        '<td style="text-align: right;">' + actionBtn + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    var wrapper = document.createElement('div');
    wrapper.className = 'data-table__wrapper';
    wrapper.appendChild(table);
    listContainer.appendChild(wrapper);

    // Event listeners dos botões de desativar
    var deactBtns = listContainer.querySelectorAll('.btn-deactivate');
    deactBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        var name = this.getAttribute('data-name');
        confirmDeactivate(uid, name);
      });
    });
  }

  // ── DESATIVAR USUÁRIO ────────────────────────────────────────

  function confirmDeactivate(uid, name) {
    VeritusUI.showModal({
      title: 'Desativar Operador?',
      confirmText: 'Desativar',
      cancelText: 'Cancelar',
      fields: [
        { label: 'Nome', value: name },
        { label: 'ID do Usuário', value: uid }
      ],
      onConfirm: function () {
        if (isFirebaseEnabled) {
          db.collection('usuarios').doc(uid).delete()
            .then(function () {
              VeritusUI.showToast('✅ Usuário desativado com sucesso!', 'success');
              renderUsers();
            })
            .catch(function (error) {
              console.error('[Usuarios] Erro ao desativar:', error);
              VeritusUI.showToast('❌ Erro ao desativar usuário no banco.', 'error');
            });
        } else {
          // Fallback local
          var localUsers = JSON.parse(localStorage.getItem('veritus_usuarios') || '[]');
          localUsers = localUsers.filter(function (u) { return u.uid !== uid; });
          localStorage.setItem('veritus_usuarios', JSON.stringify(localUsers));
          VeritusUI.showToast('✅ Usuário desativado com sucesso (local)!', 'success');
          renderUsers();
        }
      }
    });
  }

  // ── CADASTRAR USUÁRIO ────────────────────────────────────────

  function cadastrarUsuario() {
    var nome = (inputNome.value || '').trim();
    var usuario = (inputOperador.value || '').trim();
    var senha = (inputSenha.value || '').trim();
    var role = selectPerfil.value;

    if (!nome) {
      inputNome.focus();
      VeritusUI.showToast('⚠️ Digite o nome completo.', 'warning');
      return;
    }
    if (!usuario) {
      inputOperador.focus();
      VeritusUI.showToast('⚠️ Digite o nome de usuário/login.', 'warning');
      return;
    }
    if (senha.length < 6) {
      inputSenha.focus();
      VeritusUI.showToast('⚠️ A senha deve conter pelo menos 6 caracteres.', 'warning');
      return;
    }

    var email = usuario.includes('@') ? usuario : usuario.toLowerCase() + '@veritus.com';

    if (isFirebaseEnabled) {
      btnCriar.disabled = true;
      var originalBtnText = btnCriar.innerHTML;
      btnCriar.textContent = 'Registrando...';

      // Criar nova instância do app secundário para registrar sem interferir no login do Admin
      var secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryRegistration');
      
      secondaryApp.auth().createUserWithEmailAndPassword(email, senha)
        .then(function (userCredential) {
          var newUser = userCredential.user;
          
          return newUser.updateProfile({ displayName: nome })
            .then(function () {
              // Gravar no Firestore da instância do Admin logado
              return db.collection('usuarios').doc(newUser.uid).set({
                displayName: nome,
                email: email,
                role: role
              });
            })
            .then(function () {
              // Desconectar do app secundário e deletar instância
              return secondaryApp.auth().signOut();
            })
            .then(function () {
              return secondaryApp.delete();
            });
        })
        .then(function () {
          VeritusUI.showToast('✅ Usuário cadastrado com sucesso!', 'success');
          formUser.reset();
          btnCriar.disabled = false;
          btnCriar.innerHTML = originalBtnText;
          renderUsers();
        })
        .catch(function (error) {
          console.error('[Usuarios] Erro ao cadastrar usuário:', error);
          btnCriar.disabled = false;
          btnCriar.innerHTML = originalBtnText;

          var msg = 'Erro ao criar conta de acesso.';
          if (error.code === 'auth/email-already-in-use') {
            msg = 'Este nome de usuário já está em uso.';
          } else if (error.code === 'auth/invalid-email') {
            msg = 'ID do operador inválido.';
          } else if (error.code === 'auth/weak-password') {
            msg = 'Senha muito fraca.';
          }
          VeritusUI.showToast('❌ ' + msg, 'error');

          // Limpeza do app secundário em caso de erro
          secondaryApp.delete().catch(function(){});
        });

    } else {
      // Fallback local (offline)
      var localUsers = JSON.parse(localStorage.getItem('veritus_usuarios') || '[]');
      
      var exists = localUsers.some(function (u) {
        return u.usuario.toLowerCase() === usuario.toLowerCase();
      });

      if (exists) {
        VeritusUI.showToast('❌ Nome de usuário já está em uso (local).', 'error');
        inputOperador.focus();
        return;
      }

      var newUserLocal = {
        uid: 'local_' + Date.now(),
        displayName: nome,
        usuario: usuario,
        senha: senha,
        role: role
      };

      localUsers.push(newUserLocal);
      localStorage.setItem('veritus_usuarios', JSON.stringify(localUsers));

      VeritusUI.showToast('✅ Usuário cadastrado com sucesso (local)!', 'success');
      formUser.reset();
      renderUsers();
    }
  }

  // ── BIND EVENT LISTENERS ────────────────────────────────────

  if (btnCriar) {
    btnCriar.addEventListener('click', cadastrarUsuario);
  }

  // Inicializar lista
  renderUsers();

})();
