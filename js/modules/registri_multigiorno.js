// Step 64 - Registri presenze distinti per ogni giornata formativa.

window.parseTrainingCalendarDates = function(value = '') {
    const source = String(value || '');
    const matches = source.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\b/g) || [];
    const seen = new Set();
    const dates = [];

    matches.forEach(token => {
        let year;
        let month;
        let day;
        if (/^\d{4}-/.test(token)) {
            [year, month, day] = token.split('-').map(Number);
        } else {
            [day, month, year] = token.split(/[\/.-]/).map(Number);
        }
        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) return;
        const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (seen.has(iso)) return;
        seen.add(iso);
        dates.push(date);
    });

    return dates;
};

window.normalizzaGiornoFormativo = function(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (result.getDay() === 6) result.setDate(result.getDate() + 2);
    if (result.getDay() === 0) result.setDate(result.getDate() + 1);
    return result;
};

window.giornoFormativoSuccessivo = function(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + 1);
    return window.normalizzaGiornoFormativo(result);
};

window.formatRegistroHours = function(value) {
    const num = Number(value || 0);
    return Number.isInteger(num) ? String(num) : num.toFixed(1).replace('.', ',');
};

window.getTrainingDaySchedule = function(options = {}) {
    const courseId = options.courseId || window.AppState?.['cfg-corso'] || window.getVal?.('cfg-corso') || '';
    const course = window.DB_CORSI?.[courseId] || {};
    const program = Array.isArray(course.prog) ? course.prog : [];
    const totalHours = program.reduce((sum, ud) => sum + Math.max(0, Number(ud.ore || 0)), 0);
    const configuredDates = window.parseTrainingCalendarDates(
        options.calendar ?? window.AppState?.['cfg-calendario'] ?? window.getVal?.('cfg-calendario') ?? ''
    );
    const startRaw = options.startDate || window.AppState?.['cfg-data-inizio'] || window.getVal?.('cfg-data-inizio') || window.AppState?.['cfg-data-esame'] || '';
    let start = configuredDates[0];

    if (!start && startRaw) {
        const parts = String(startRaw).split('-').map(Number);
        if (parts.length === 3) start = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    if (!start || Number.isNaN(start.getTime())) start = new Date();
    start = window.normalizzaGiornoFormativo(start);

    const automaticDayCount = Math.max(1, Math.ceil(totalHours / 8));
    const dayCount = Math.max(automaticDayCount, configuredDates.length || 0, 1);
    const dates = [...configuredDates];
    while (dates.length < dayCount) {
        const previous = dates.length ? dates[dates.length - 1] : new Date(start.getFullYear(), start.getMonth(), start.getDate());
        if (!dates.length) dates.push(previous);
        else dates.push(window.giornoFormativoSuccessivo(previous));
    }

    const distributeAcrossAllConfiguredDays = configuredDates.length > automaticDayCount;
    const dailyCapacity = distributeAcrossAllConfiguredDays && totalHours > 0
        ? Math.min(8, Math.ceil(totalHours / dayCount))
        : 8;
    const docentiUd = window.parseJSONSafe
        ? window.parseJSONSafe(window.AppState?.['cfg-docenti-ud'] || window.getVal?.('cfg-docenti-ud', '{}') || '{}', {})
        : {};
    const docenti = Array.isArray(window.docentiList) ? window.docentiList : [];

    const days = dates.map((date, index) => ({
        index,
        number: index + 1,
        total: dayCount,
        date,
        iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        label: date.toLocaleDateString('it-IT'),
        hours: 0,
        segments: [],
        teachers: []
    }));

    let dayIndex = 0;
    let usedToday = 0;
    program.forEach(ud => {
        let remaining = Math.max(0, Number(ud.ore || 0));
        while (remaining > 0 && dayIndex < days.length) {
            const available = dailyCapacity - usedToday;
            if (available <= 0) {
                dayIndex += 1;
                usedToday = 0;
                continue;
            }
            const allocated = Math.min(remaining, available);
            const teacherId = docentiUd[ud.ud] || '';
            const teacher = docenti.find(item => item.id === teacherId)?.nome_cognome || '';
            const day = days[dayIndex];
            day.hours += allocated;
            day.segments.push({
                ud: ud.ud || '',
                title: ud.m || 'Attività formativa',
                hours: allocated,
                teacher
            });
            if (teacher && !day.teachers.includes(teacher)) day.teachers.push(teacher);
            usedToday += allocated;
            remaining -= allocated;
        }
    });

    const defaultTeacher = docenti.find(item => item.id === Object.values(docentiUd)[0])?.nome_cognome || 'Docente da indicare';
    days.forEach(day => {
        if (!day.teachers.length) day.teachers.push(defaultTeacher);
    });
    return days;
};

window.applyRegisterDayFields = function(page, day) {
    if (!page || !day) return;
    const setText = (selector, value, fallback = '---') => {
        page.querySelectorAll(selector).forEach(el => {
            el.textContent = value === null || value === undefined || value === '' ? fallback : String(value);
        });
    };
    const topics = day.segments.length
        ? day.segments.map(item => `${item.ud}: ${item.title} (${window.formatRegistroHours(item.hours)} h)`).join(' · ')
        : 'Programma della giornata da confermare';
    const teachers = day.teachers.filter(Boolean).join(' · ');

    setText('.val-registro-giornata', `${day.number} di ${day.total}`);
    setText('.val-registro-data', day.label);
    setText('.val-data-esame', day.label);
    setText('.val-registro-ore', `${window.formatRegistroHours(day.hours)} h`);
    setText('.val-registro-argomenti', topics);
    setText('.val-registro-docenti', teachers);
    setText('.val-docente-main', teachers);
    page.querySelectorAll('.auto-signature-slot').forEach(slot => {
        const role = slot.getAttribute('data-signature-role') || '';
        const selector = slot.getAttribute('data-signature-name-selector') || '';
        const name = selector ? (page.querySelector(selector)?.textContent || '').trim() : '';
        const automatic = window.getAutoSignaturePathByNameAndRole
            ? window.getAutoSignaturePathByNameAndRole(name, role)
            : '';
        const source = window.resolveSignatureSource?.(name, role) || automatic;
        if (window.renderAutoSignatureSlot) window.renderAutoSignatureSlot(slot, source, name, automatic);
    });
    page.dataset.registerDayPage = String(day.number);
    page.dataset.registerDayDate = day.iso;
    page.dataset.registerDayHours = String(day.hours);
};

window.expandRegisterPagesByTrainingDay = function(basePages = [], options = {}) {
    if (!basePages.length) return [];
    const days = window.getTrainingDaySchedule(options);
    const template = basePages[0];
    return days.map(day => {
        const page = template.cloneNode(true);
        page.removeAttribute('id');
        page.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        page.classList.remove('scale-[0.8]', 'origin-top');
        page.style.margin = options.preview ? '0 auto 16px auto' : '0 auto';
        if (options.preview) page.classList.add('scale-[0.8]', 'origin-top');
        else {
            page.classList.add('print-show', 'temp-page', 'landscape-force');
            page.classList.remove('portrait');
        }
        window.applyRegisterDayFields(page, day);
        return page;
    });
};

window.getMultiDayRegisterSummary = function() {
    const days = window.getTrainingDaySchedule();
    return {
        days: days.length,
        totalHours: days.reduce((sum, day) => sum + Number(day.hours || 0), 0),
        labels: days.map(day => day.label)
    };
};
