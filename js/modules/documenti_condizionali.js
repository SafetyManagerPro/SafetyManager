// Step 65 - Documenti condizionali e dichiarazioni per tutti i docenti assegnati.

window.step65Boolean = function(value, fallback = false) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    const normalized = String(value ?? '').trim().toLowerCase();
    if (['true', '1', 'si', 'sì', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return fallback;
};

window.isAssociationTrainingProvider = function() {
    const provider = window.AppState?.['cfg-ente-erogatore'] ??
        window.getVal?.('cfg-ente-erogatore', 'ente') ??
        'ente';
    return String(provider).trim().toLowerCase() === 'ente';
};

window.isTutorExpectedForProject = function(project = null) {
    if (project && Object.prototype.hasOwnProperty.call(project, 'tutor_previsto')) {
        return window.step65Boolean(project.tutor_previsto, false);
    }
    if (project && String(project.tutor_nome || '').trim()) return true;

    const stateValue = window.AppState?.['cfg-tutor-previsto'];
    if (stateValue !== undefined && stateValue !== null && stateValue !== '') {
        return window.step65Boolean(stateValue, false);
    }
    return !!String(window.AppState?.['cfg-tutor-nome'] || '').trim();
};

window.getAssignedProjectTeachers = function() {
    const parse = window.parseJSONSafe || ((value, fallback = {}) => {
        try { return typeof value === 'string' ? JSON.parse(value) : (value || fallback); }
        catch (_) { return fallback; }
    });
    const assignments = parse(
        window.AppState?.['cfg-docenti-ud'] ??
        window.getVal?.('cfg-docenti-ud', '{}') ??
        '{}',
        {}
    );
    const teachers = Array.isArray(window.docentiList) ? window.docentiList : [];
    const courseId = window.AppState?.['cfg-corso'] || window.getVal?.('cfg-corso', '') || '';
    const units = window.DB_CORSI?.[courseId]?.prog || [];
    const unitLabels = new Map(units.map(unit => [
        String(unit.ud || ''),
        `${unit.ud || ''}${unit.titolo ? ` — ${unit.titolo}` : ''}`
    ]));
    const grouped = new Map();

    Object.entries(assignments || {}).forEach(([unitId, teacherId]) => {
        if (!teacherId) return;
        const teacher = teachers.find(item =>
            String(item.id) === String(teacherId) ||
            String(item.nome_cognome || '').trim().toLowerCase() === String(teacherId).trim().toLowerCase()
        );
        if (!teacher) return;
        const key = String(teacher.id || teacher.nome_cognome || teacherId);
        if (!grouped.has(key)) grouped.set(key, { ...teacher, assigned_units: [] });
        const label = unitLabels.get(String(unitId)) || String(unitId);
        if (label && !grouped.get(key).assigned_units.includes(label)) {
            grouped.get(key).assigned_units.push(label);
        }
    });

    return Array.from(grouped.values());
};

window.applyTeacherDeclarationData = function(page, teacher, index = 0, total = 1) {
    if (!page || !teacher) return;
    const setText = (selector, value, fallback = '---') => {
        page.querySelectorAll(selector).forEach(el => { el.textContent = value || fallback; });
    };
    const name = teacher.nome_cognome || teacher.nome || '';
    const birth = teacher.luogo_data_nascita || teacher.data_nascita || teacher.nascita || '';
    const units = Array.isArray(teacher.assigned_units) ? teacher.assigned_units.join('; ') : '';

    setText('.val-nome', name);
    setText('.val-cf', teacher.cf || '');
    setText('.val-nascita', birth, 'Non indicato in anagrafica');
    setText('.val-docente-qualifica', teacher.qualifica || '', 'Qualifica da verificare');
    setText('.val-docente-azienda', teacher.azienda_appartenenza || '', 'Non indicata');
    setText('.val-docente-unita', units, 'Unità didattiche assegnate nel progetto');
    setText('.val-docente-progressivo', `${index + 1} di ${total}`);

    const dlRspp = !window.isAssociationTrainingProvider() &&
        /datore\s+di\s+lavoro|dl\s*\/?\s*rspp|art\.?\s*34/i.test(String(teacher.qualifica || ''));
    page.querySelectorAll('.check-box-dl').forEach(el => {
        el.textContent = dlRspp ? 'X' : '';
        el.classList.toggle('bg-slate-900', dlRspp);
        el.classList.toggle('text-white', dlRspp);
    });
    page.querySelectorAll('.check-box-docente').forEach(el => {
        el.textContent = dlRspp ? '' : 'X';
        el.classList.toggle('bg-slate-900', !dlRspp);
        el.classList.toggle('text-white', !dlRspp);
    });

    page.dataset.teacherDeclarationPage = String(index + 1);
    page.dataset.teacherId = String(teacher.id || '');
    page.dataset.teacherName = name;

    page.querySelectorAll('.auto-signature-slot').forEach(slot => {
        const automatic = window.getAutoSignaturePathByNameAndRole?.(name, 'docente') || '';
        const signature = teacher.firma_docente_url || automatic;
        if (typeof window.renderAutoSignatureSlot === 'function') {
            window.renderAutoSignatureSlot(slot, signature, name);
        }
    });
};

window.expandTeacherDeclarationPages = function(basePages = []) {
    const teachers = window.getAssignedProjectTeachers();
    if (!teachers.length || !basePages.length) return [];

    const expanded = [];
    teachers.forEach((teacher, index) => {
        basePages.forEach(basePage => {
            const page = basePage.cloneNode(true);
            page.id = '';
            window.applyTeacherDeclarationData(page, teacher, index, teachers.length);
            expanded.push(page);
        });
    });
    return expanded;
};

window.getConditionalPrintMessage = function(moduleId) {
    if (moduleId === 'autocert' && !window.isAssociationTrainingProvider()) {
        return 'Documento non applicabile: il soggetto formatore è il datore di lavoro che forma esclusivamente i propri lavoratori. La dichiarazione di conformità dell’associazione viene prodotta solo quando l’associazione è l’ente formatore/erogatore.';
    }
    if (moduleId === 'relazione_tutor' && !window.isTutorExpectedForProject()) {
        return 'Relazione non applicabile: nel progetto selezionato il tutor non è previsto.';
    }
    if (moduleId === 'dichiarazione_docenza' && !window.getAssignedProjectTeachers().length) {
        return 'Nessuna dichiarazione generata: assegna almeno un docente alle unità didattiche del progetto.';
    }
    return 'Il documento non è applicabile o non dispone dei dati necessari.';
};

window.updateConditionalPrintButtons = function() {
    const association = window.isAssociationTrainingProvider();
    const tutorExpected = window.isTutorExpectedForProject();
    const teachers = window.getAssignedProjectTeachers();
    const configure = (id, enabled, title) => {
        const button = document.getElementById(id);
        if (!button) return;
        button.disabled = !enabled;
        button.title = enabled ? '' : title;
        button.classList.toggle('opacity-40', !enabled);
        button.classList.toggle('cursor-not-allowed', !enabled);
    };
    configure(
        'btn-print-autocert-ente',
        association,
        'Disponibile solo quando associazione/ente è il soggetto formatore.'
    );
    configure(
        'btn-print-relazione-tutor',
        tutorExpected,
        'Tutor non previsto nel progetto.'
    );
    configure(
        'btn-print-dichiarazioni-docenti',
        teachers.length > 0,
        'Assegna almeno un docente alle unità didattiche.'
    );
};
