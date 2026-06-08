/* ============================================================
   VERITUS ENGENHARIA — Store (Camada de Dados)
   Persistência via localStorage para viagens escaneadas.
   ============================================================ */

var VeritusStore = (function () {
  'use strict';

  var STORAGE_KEY = 'veritus_viagens';
  var OPERADOR_KEY = 'veritus_operador';

  var _viagensCache = [];
  var _isInitialized = false;

  // ── Inicializar Listener Firestore ───────────────────────────

  if (typeof db !== 'undefined') {
    db.collection('viagens').onSnapshot(function (snapshot) {
      var list = [];
      snapshot.forEach(function (doc) {
        var data = doc.data();
        data.id = doc.id;
        list.push(data);
      });
      _viagensCache = list;
      _isInitialized = true;

      // Salva no localStorage como backup local rápido
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_viagensCache));
      } catch (e) {
        console.error('[VeritusStore] Erro ao salvar cache no localStorage:', e);
      }

      // Disparar evento para atualizar a interface de forma reativa
      document.dispatchEvent(new CustomEvent('veritus-data-updated'));
    }, function (err) {
      console.error('[VeritusStore] Erro no listener do Firestore:', err);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _generateId() {
    return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  function _getAll() {
    if (typeof db !== 'undefined' && _viagensCache.length > 0) {
      return _viagensCache;
    }
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[VeritusStore] Erro ao ler localStorage:', e);
      return [];
    }
  }

  function _saveAll(viagens) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viagens));
    } catch (e) {
      console.error('[VeritusStore] Erro ao salvar localStorage:', e);
    }
  }

  /**
   * Converte date string DD/MM/YYYY para YYYY-MM-DD
   * Também aceita YYYY-MM-DD diretamente.
   */
  function _normalizeDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    var parts = dateStr.split('/');
    if (parts.length === 3) {
      return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return dateStr;
  }

  /**
   * Extrai a data (YYYY-MM-DD) de um timestamp ISO.
   */
  function _extractDate(timestamp) {
    return timestamp ? timestamp.substring(0, 10) : '';
  }

  // ── API Pública ─────────────────────────────────────────────

  function getViagens() {
    return _getAll();
  }

  function getViagensByDate(dateStr) {
    var normalized = _normalizeDate(dateStr);
    if (!normalized) return [];
    var all = _getAll();
    return all.filter(function (v) {
      return _extractDate(v.timestamp) === normalized;
    });
  }

  function addViagem(dados) {
    var viagem = {
      truck: (dados.truck || '').toUpperCase().trim(),
      corte: (dados.corte || '').trim(),
      aterro: (dados.aterro || '').trim(),
      carga: (dados.carga || '').trim(),
      timestamp: new Date().toISOString(),
      operador: getOperador()
    };

    if (typeof db !== 'undefined') {
      db.collection('viagens').add(viagem).then(function (docRef) {
        console.log('[VeritusStore] Viagem salva no Firestore com ID:', docRef.id);
      }).catch(function (error) {
        console.error('[VeritusStore] Erro ao salvar no Firestore:', error);
      });
      viagem.id = 'temp_' + Date.now();
      return viagem;
    } else {
      viagem.id = _generateId();
      var all = _getAll();
      all.push(viagem);
      _saveAll(all);
      return viagem;
    }
  }

  function getStats(dateStr) {
    var viagens = dateStr ? getViagensByDate(dateStr) : _getAll();
    var trucks = {};
    viagens.forEach(function (v) {
      trucks[v.truck] = (trucks[v.truck] || 0) + 1;
    });

    var totalViagens = viagens.length;
    var totalTrucks = Object.keys(trucks).length;
    var eficiencia = 0;
    if (totalTrucks > 0) {
      var trucksMulti = Object.values(trucks).filter(function (c) { return c > 1; }).length;
      eficiencia = Math.round((trucksMulti / totalTrucks) * 100);
    }

    return {
      totalViagens: totalViagens,
      totalTrucks: totalTrucks,
      eficiencia: eficiencia
    };
  }

  function getTruckStats(dateStr) {
    var viagens = dateStr ? getViagensByDate(dateStr) : _getAll();
    var trucks = {};
    viagens.forEach(function (v) {
      if (!trucks[v.truck]) {
        trucks[v.truck] = { truck: v.truck, viagens: 0, ultima: v.timestamp };
      }
      trucks[v.truck].viagens++;
      if (v.timestamp > trucks[v.truck].ultima) {
        trucks[v.truck].ultima = v.timestamp;
      }
    });

    return Object.values(trucks).sort(function (a, b) {
      return b.viagens - a.viagens;
    });
  }

  function exportData(dateStr) {
    var viagens = dateStr ? getViagensByDate(dateStr) : _getAll();
    return viagens.map(function (v) {
      var d = new Date(v.timestamp);
      return {
        'Placa': v.truck,
        'Corte': v.corte,
        'Aterro': v.aterro,
        'Carga': v.carga,
        'Data': d.toLocaleDateString('pt-BR'),
        'Hora': d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        'Operador': v.operador
      };
    });
  }

  function clearViagens() {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof db !== 'undefined') {
      db.collection('viagens').get().then(function (querySnapshot) {
        var batch = db.batch();
        querySnapshot.forEach(function (doc) {
          batch.delete(doc.ref);
        });
        return batch.commit();
      }).then(function () {
        console.log('[VeritusStore] Viagens removidas do Firestore.');
      }).catch(function (error) {
        console.error('[VeritusStore] Erro ao limpar viagens no Firestore:', error);
      });
    }
  }

  function setOperador(nome) {
    localStorage.setItem(OPERADOR_KEY, nome || 'Operador Demo');
  }

  function getOperador() {
    return localStorage.getItem(OPERADOR_KEY) || 'Operador Demo';
  }

  function gerarDemoViagens() {
    var demos = [
      { truck: 'ABC-1D23', corte: 'Solo Arenoso', aterro: 'Aterro Norte', carga: 'Terra' },
      { truck: 'DEF-4E56', corte: 'Rocha Bruta', aterro: 'Aterro Sul', carga: 'Pedra' },
      { truck: 'GHI-7F89', corte: 'Argila', aterro: 'Aterro Leste', carga: 'Argila Compacta' },
      { truck: 'ABC-1D23', corte: 'Solo Arenoso', aterro: 'Aterro Oeste', carga: 'Terra' },
      { truck: 'JKL-0G12', corte: 'Cascalho', aterro: 'Aterro Norte', carga: 'Cascalho' }
    ];

    var now = Date.now();
    demos.forEach(function (d, i) {
      var viagem = {
        truck: d.truck,
        corte: d.corte,
        aterro: d.aterro,
        carga: d.carga,
        timestamp: new Date(now - (i * 45 * 60000)).toISOString(),
        operador: getOperador()
      };

      if (typeof db !== 'undefined') {
        db.collection('viagens').add(viagem);
      } else {
        viagem.id = _generateId();
        var all = _getAll();
        all.push(viagem);
        _saveAll(all);
      }
    });

    return demos.length;
  }

  function getToday() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
  }

  return {
    getViagens: getViagens,
    getViagensByDate: getViagensByDate,
    addViagem: addViagem,
    getStats: getStats,
    getTruckStats: getTruckStats,
    exportData: exportData,
    clearViagens: clearViagens,
    setOperador: setOperador,
    getOperador: getOperador,
    gerarDemoViagens: gerarDemoViagens,
    getToday: getToday,
    formatDateBR: formatDateBR
  };
})();
