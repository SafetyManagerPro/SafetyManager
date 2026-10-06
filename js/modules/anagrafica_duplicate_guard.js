// Controllo anti-duplicato anagrafiche: aziende, docenti, corsisti.
// Protezione applicativa complementare ai trigger DB: segnala prima del salvataggio
// P.IVA/C.F. o Codice Fiscale già presenti nello stesso ente.
(() => {
  if (window.__safetyDuplicateGuardLoaded) return;
  window.__safetyDuplicateGuardLoaded = true;

  const clean = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizzaCf = (value) => clean(value);
  const normalizzaPivaCf = (value) => {
    let v = clean(value);
    if (/^IT\d{11}$/.test(v)) v = v.slice(2);
    return v;
  };
  const sameScope = (a, b) => String(a ?? '') === String(b ?? '');

  window.normalizzaChiaveFiscale = normalizzaCf;
  window.normalizzaPivaCf = normalizzaPivaCf;

  async function findDuplicate({ table, field, value, id = null, enteId = undefined, nameField, normalizer }) {
    const key = normalizer(value);
    if (!key || !window.supabaseClient) return null;

    try {
      const selectFields = `id,${field},${nameField},ente_id`;
      const { data, error } = await window.supabaseClient.from(table).select(selectFields);
      if (error) throw error;
      const rows = data || [];
      const self = id ? rows.find(r => String(r.id) === String(id)) : null;
      const scope = enteId !== undefined ? enteId : (self?.ente_id ?? null);

      // I duplicati storici non devono impedire la modifica di altri dati del record:
      // blocchiamo solo nuovi inserimenti o cambi della chiave fiscale verso una chiave già usata.
      if (self && normalizer(self[field]) === key && sameScope(self.ente_id, scope)) return null;

      return rows.find(r =>
        String(r.id) !== String(id || '') &&
        sameScope(r.ente_id, scope) &&
        normalizer(r[field]) === key
      ) || null;
    } catch (error) {
      console.warn('Controllo duplicato anagrafica non riuscito:', table, error);
      // In caso di errore lasciamo decidere al vincolo DB, evitando falsi blocchi lato UI.
      return null;
    }
  }

  const originalSaveAzienda = window.saveAzienda;
  if (typeof originalSaveAzienda === 'function') {
    window.saveAzienda = async function(record = {}) {
      const normalized = normalizzaPivaCf(record.piva_cf);
      if (normalized) {
        const duplicate = await findDuplicate({
          table: 'aziende', field: 'piva_cf', value: record.piva_cf,
          id: record.id || null, enteId: record.ente_id,
          nameField: 'ragione_sociale', normalizer: normalizzaPivaCf
        });
        if (duplicate) {
          alert(`Partita IVA / Codice Fiscale già presente: ${duplicate.ragione_sociale || 'azienda esistente'} (${duplicate.piva_cf || normalized}). Operazione annullata per evitare doppioni.`);
          return false;
        }
        record.piva_cf = String(record.piva_cf || '').trim().toUpperCase().replace(/\s+/g, '');
      }
      return await originalSaveAzienda(record);
    };
  }

  const originalSaveDocente = window.saveDocente;
  if (typeof originalSaveDocente === 'function') {
    window.saveDocente = async function(record = {}) {
      const normalized = normalizzaCf(record.cf);
      if (normalized) {
        const duplicate = await findDuplicate({
          table: 'docenti', field: 'cf', value: record.cf,
          id: record.id || null, enteId: record.ente_id,
          nameField: 'nome_cognome', normalizer: normalizzaCf
        });
        if (duplicate) {
          alert(`Codice fiscale docente già presente: ${duplicate.nome_cognome || 'docente esistente'} (${duplicate.cf || normalized}). Operazione annullata per evitare doppioni.`);
          return false;
        }
        record.cf = normalized;
      }
      return await originalSaveDocente(record);
    };
  }

  const originalSaveCorsista = window.saveCorsistaData;
  if (typeof originalSaveCorsista === 'function') {
    window.saveCorsistaData = async function(record = {}) {
      const normalized = normalizzaCf(record.cf);
      if (normalized) {
        const duplicate = await findDuplicate({
          table: 'corsisti', field: 'cf', value: record.cf,
          id: record.id || null, enteId: record.ente_id,
          nameField: 'nome_cognome', normalizer: normalizzaCf
        });
        if (duplicate) {
          alert(`Codice fiscale corsista già presente: ${duplicate.nome_cognome || 'corsista esistente'} (${duplicate.cf || normalized}). Operazione annullata per evitare doppioni.`);
          return false;
        }
        record.cf = normalized;
      }
      return await originalSaveCorsista(record);
    };
  }

  window.SafetyDuplicateGuard = { normalizzaCf, normalizzaPivaCf, findDuplicate };
})();
