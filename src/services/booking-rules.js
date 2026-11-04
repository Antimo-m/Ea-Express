const minute = 60000;
const fields = ['pickup_date', 'pickup_from', 'pickup_to'];
const parts = instant => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Rome', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(part => [part.type,part.value]));
const dateOf = value => `${value.year}-${value.month}-${value.day}`;
const timeOf = value => `${value.hour}:${value.minute}`;
const timeMinutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const formatMinutes = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export function bookingLimits(serverTime, data, original = null, leadMinutes = 1) {
    const current = parts(serverTime);
    const minimum = parts(Math.ceil((serverTime + leadMinutes * minute) / minute) * minute);
    const minimumDate = dateOf(minimum);
    const unchanged = leadMinutes === 0 && original && fields.every(key => data[key] === original[key]);
    const minTime = !unchanged && data.pickup_date === minimumDate ? timeOf(minimum) : '';
    const unavailable = !unchanged && Boolean(data.pickup_date) && (data.pickup_date < minimumDate || (data.pickup_date === minimumDate && minTime === '23:59'));
    return {date: unchanged ? original.pickup_date : minimumDate, today: dateOf(current), time:minTime, unavailable, unchanged};
}

export function defaultPickupSchedule(serverTime, selectedDate = '', dateTouched = false) {
    let earliest = Math.ceil((serverTime + minute) / minute) * minute;
    if (timeOf(parts(earliest)) === '23:59') earliest += minute;
    const minimum = parts(earliest);
    const minimumDate = dateOf(minimum);
    const date = dateTouched ? selectedDate : minimumDate;
    const from = date === minimumDate ? timeOf(minimum) : '09:00';
    const to = formatMinutes(Math.min(1439, Math.max(12 * 60, timeMinutes(from) + 60)));
    return {pickup_date:date, pickup_from:from, pickup_to:to};
}

export function attachBookingRules(form, payload, original = null, reload) {
    if (!form) return () => {};
    let clock = {value:Date.parse(payload.server_now), captured:performance.now()};
    let stopped = false;
    let dateTouched = Boolean(original?.pickup_date);
    let fromTouched = Boolean(original?.pickup_from);
    let toTouched = Boolean(original?.pickup_to);
    const date = form.elements.namedItem('pickup_date');
    const from = form.elements.namedItem('pickup_from');
    const to = form.elements.namedItem('pickup_to');
    const error = document.createElement('small');
    error.className = 'field-error'; error.id = `${from.id}-schedule-error`; error.setAttribute('role', 'alert'); error.hidden = true;
    from.closest('.field').append(error);
    const update = () => {
        const serverTime = clock.value + performance.now() - clock.captured;
        const defaults = defaultPickupSchedule(serverTime, date.value, dateTouched);
        if (!dateTouched && date.value !== defaults.pickup_date) date.value = defaults.pickup_date;
        if (!fromTouched && from.value !== defaults.pickup_from) from.value = defaults.pickup_from;
        const defaultEnd = defaults.pickup_to > from.value ? defaults.pickup_to : formatMinutes(Math.min(1439, timeMinutes(from.value) + 60));
        if (!toTouched && to.value !== defaultEnd) to.value = defaultEnd;
        const data = Object.fromEntries(fields.map(name => [name, form.elements.namedItem(name).value]));
        const limits = bookingLimits(serverTime, data, original);
        date.min = limits.date; from.min = limits.time;
        const end = from.value ? timeMinutes(from.value) + 1 : 0;
        to.min = end < 1440 ? formatMinutes(end) : '';
        const message = limits.unavailable || (from.value && limits.time && from.value < limits.time)
            ? 'Scegli un orario di ritiro almeno un minuto dopo l’ora attuale italiana.' : '';
        from.setCustomValidity(message);
        to.setCustomValidity(from.value && to.value && to.value <= from.value ? 'La fine del ritiro deve seguire l’orario iniziale.' : '');
        error.textContent = message; error.hidden = !message;
        const descriptions = new Set((from.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
        if (message) {
            from.setAttribute('aria-invalid', 'true'); descriptions.add(error.id);
        } else {
            descriptions.delete(error.id);
            if (!from.closest('.field').querySelector('.field-error:not([hidden])')) from.removeAttribute('aria-invalid');
        }
        if (descriptions.size) from.setAttribute('aria-describedby', [...descriptions].join(' '));
        else from.removeAttribute('aria-describedby');
    };
    const change = event => {
        if (event.target === date) dateTouched = true;
        if (event.target === from) fromTouched = true;
        if (event.target === to) toTouched = true;
        update();
    };
    const sync = async () => {
        update();
        if (reload) {
            try {
                const next = await reload();
                if (!stopped && Number.isFinite(Date.parse(next.server_now))) {
                    clock = {value:Date.parse(next.server_now),captured:performance.now()}; update();
                }
            } catch { /* Final validation uses the authoritative server clock. */ }
        }
    };
    const visibility = () => {if (!document.hidden) sync();};
    const submit = event => {update(); if (!form.reportValidity()) {event.preventDefault(); event.stopImmediatePropagation();}};
    form.addEventListener('input',change); form.addEventListener('change',change); form.addEventListener('submit',submit,true);
    window.addEventListener('focus',sync); document.addEventListener('visibilitychange',visibility);
    const interval = setInterval(update,1000); update(); sync();
    return () => {
        stopped=true; clearInterval(interval); error.remove();
        form.removeEventListener('input',change); form.removeEventListener('change',change); form.removeEventListener('submit',submit,true);
        window.removeEventListener('focus',sync); document.removeEventListener('visibilitychange',visibility);
    };
}
