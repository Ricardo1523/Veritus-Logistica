/* ============================================================
   VERITUS ENGENHARIA — UI Components
   Toast notifications, modal de confirmação, e utilitários UI.
   ============================================================ */

var VeritusUI = (function () {
  'use strict';

  // ── Toast Container ─────────────────────────────────────────

  var toastContainer = null;

  function _ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  /**
   * Mostra uma notificação toast.
   * @param {string} message - Texto da notificação
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Duração em ms (default: 3500)
   */
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3500;

    var container = _ensureToastContainer();

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML =
      '<span class="toast__message">' + message + '</span>' +
      '<button class="toast__close" aria-label="Fechar">&times;</button>';

    // Fechar ao clicar
    toast.querySelector('.toast__close').addEventListener('click', function () {
      _removeToast(toast);
    });

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(function () {
      toast.classList.add('toast--visible');
    });

    // Auto remove
    setTimeout(function () {
      _removeToast(toast);
    }, duration);
  }

  function _removeToast(toast) {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // ── Modal ───────────────────────────────────────────────────

  /**
   * Mostra um modal de confirmação.
   * @param {Object} options
   * @param {string} options.title
   * @param {Array} options.fields - [{ label, value }]
   * @param {string} options.confirmText
   * @param {string} options.cancelText
   * @param {Function} options.onConfirm
   * @param {Function} options.onCancel
   */
  function showModal(options) {
    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';

    // Modal
    var modal = document.createElement('div');
    modal.className = 'modal';

    // Header
    var header = '<div class="modal__header">';
    header += '<h3 class="modal__title">' + (options.title || 'Confirmação') + '</h3>';
    header += '</div>';

    // Body com campos
    var body = '<div class="modal__body">';
    if (options.fields && options.fields.length) {
      options.fields.forEach(function (field) {
        body += '<div class="modal__field">';
        body += '<span class="modal__field-label">' + field.label + '</span>';
        body += '<span class="modal__field-value">' + (field.value || '—') + '</span>';
        body += '</div>';
      });
    }
    body += '</div>';

    // Footer com botões
    var footer = '<div class="modal__footer">';
    footer += '<button class="btn btn--outline modal__btn-cancel" type="button">' + (options.cancelText || 'Cancelar') + '</button>';
    footer += '<button class="btn btn--primary modal__btn-confirm" type="button">' + (options.confirmText || 'Confirmar') + '</button>';
    footer += '</div>';

    modal.innerHTML = header + body + footer;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(function () {
      overlay.classList.add('modal-overlay--visible');
    });

    // Event handlers
    var btnConfirm = modal.querySelector('.modal__btn-confirm');
    var btnCancel = modal.querySelector('.modal__btn-cancel');

    function closeModal() {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(function () {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }

    btnConfirm.addEventListener('click', function () {
      closeModal();
      if (options.onConfirm) options.onConfirm();
    });

    btnCancel.addEventListener('click', function () {
      closeModal();
      if (options.onCancel) options.onCancel();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
        if (options.onCancel) options.onCancel();
      }
    });
  }

  // ── Expor API ───────────────────────────────────────────────

  return {
    showToast: showToast,
    showModal: showModal
  };
})();
