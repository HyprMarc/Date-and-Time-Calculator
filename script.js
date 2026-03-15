/* ===================================================
   ChronoCalc — Script
   =================================================== */

(() => {
  'use strict';

  // ── Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function formatDate(d) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatDateTime(d) {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} — ${h}:${m}:${s}`;
  }

  function clampDay(year, month, day) {
    const max = daysInMonth(year, month);
    return Math.min(day, max);
  }

  // ── Tabs ──
  const tabBtns = $$('.tab-btn');
  const panels = $$('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $(`#${btn.dataset.tab}`);
      panel.classList.add('active');
    });
  });

  // ── Spin Buttons ──
  $$('.spin-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $(`#${btn.dataset.target}`);
      const step = parseInt(btn.dataset.step, 10);
      let val = parseInt(input.value, 10) || 0;
      val += step;

      // Enforce min/max if set
      const min = input.hasAttribute('min') ? parseInt(input.min, 10) : -Infinity;
      const max = input.hasAttribute('max') ? parseInt(input.max, 10) : Infinity;
      if (val < min) val = max !== Infinity ? max : min;
      if (val > max) val = min !== -Infinity ? min : max;

      input.value = val;
      input.dispatchEvent(new Event('change'));
    });
  });

  // ── Ripple Effect on Buttons ──
  $$('.neu-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // ============================
  //  DAY FINDER
  // ============================
  const dfYear = $('#df-year');
  const dfMonth = $('#df-month');
  const dfDay = $('#df-day');

  function findDay() {
    const y = parseInt(dfYear.value, 10);
    const m = parseInt(dfMonth.value, 10);
    let d = parseInt(dfDay.value, 10);

    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1 || m < 1 || m > 12) return;

    // Clamp day
    d = clampDay(y, m, d);
    dfDay.value = d;

    const date = new Date(y, m - 1, d);
    // Fix for years < 100
    date.setFullYear(y);

    const dayName = DAYS[date.getDay()];

    // Result card
    const resultCard = $('#df-result');
    resultCard.classList.remove('hidden', 'show');

    // Force reflow for re-animation
    void resultCard.offsetWidth;
    resultCard.classList.add('show');

    $('#df-result-badge').textContent = dayName;
    $('#df-result-date').textContent = formatDate(date);

    // Extra info
    const extras = [];
    if (isLeapYear(y)) extras.push('Leap Year');
    const dayOfYear = Math.ceil((date - new Date(y, 0, 1)) / 86400000) + 1;
    extras.push(`${ordinal(dayOfYear)} day of the year`);
    const weekNum = Math.ceil(dayOfYear / 7);
    extras.push(`Week ${weekNum}`);
    $('#df-result-extra').textContent = extras.join('  •  ');

    // Calendar
    buildCalendar(y, m, d);
  }

  $('#btn-find-day').addEventListener('click', findDay);

  // Allow Enter key
  [dfYear, dfMonth, dfDay].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') findDay();
    });
  });

  // ── Mini Calendar ──
  function buildCalendar(year, month, selectedDay) {
    const calCard = $('#df-calendar-card');
    calCard.classList.remove('hidden', 'show');
    void calCard.offsetWidth;
    calCard.classList.add('show');

    $('#df-cal-title').textContent = `${MONTHS[month - 1]} ${year}`;

    const grid = $('#df-calendar-grid');
    grid.innerHTML = '';

    // Day headers
    const shortDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    shortDays.forEach((name) => {
      const el = document.createElement('div');
      el.className = 'cal-head';
      el.textContent = name;
      grid.appendChild(el);
    });

    const firstDay = new Date(year, month - 1, 1);
    firstDay.setFullYear(year);
    const startDay = firstDay.getDay();
    const totalDays = daysInMonth(year, month);
    const prevMonthDays = daysInMonth(year, month - 1 || 12);

    // Previous month filler
    for (let i = startDay - 1; i >= 0; i--) {
      const el = document.createElement('div');
      el.className = 'cal-day other-month';
      el.textContent = prevMonthDays - i;
      grid.appendChild(el);
    }

    // Current month
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const el = document.createElement('div');
      el.className = 'cal-day';

      if (d === selectedDay) el.classList.add('selected');
      if (d === today.getDate() && month - 1 === today.getMonth() && year === today.getFullYear()) {
        el.classList.add('today');
      }

      el.textContent = d;

      // Click to select
      el.addEventListener('click', () => {
        dfDay.value = d;
        findDay();
      });

      grid.appendChild(el);
    }

    // Next month filler
    const cells = startDay + totalDays;
    const remaining = cells % 7 === 0 ? 0 : 7 - (cells % 7);
    for (let i = 1; i <= remaining; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day other-month';
      el.textContent = i;
      grid.appendChild(el);
    }
  }

  // ============================
  //  DATE ADDER
  // ============================
  function addDuration() {
    const y = parseInt($('#da-year').value, 10);
    const m = parseInt($('#da-month').value, 10);
    let d = parseInt($('#da-day').value, 10);
    const h = parseInt($('#da-hour').value, 10) || 0;
    const min = parseInt($('#da-minute').value, 10) || 0;
    const sec = parseInt($('#da-second').value, 10) || 0;

    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1 || m < 1 || m > 12) return;

    d = clampDay(y, m, d);
    $('#da-day').value = d;

    const startDate = new Date(y, m - 1, d, h, min, sec);
    startDate.setFullYear(y);

    // Duration
    const addYears = parseInt($('#da-add-years').value, 10) || 0;
    const addMonths = parseInt($('#da-add-months').value, 10) || 0;
    const addDays = parseInt($('#da-add-days').value, 10) || 0;
    const addHours = parseInt($('#da-add-hours').value, 10) || 0;
    const addMins = parseInt($('#da-add-minutes').value, 10) || 0;
    const addSecs = parseInt($('#da-add-seconds').value, 10) || 0;

    // Add years & months first (calendar arithmetic)
    let resultDate = new Date(startDate.getTime());
    resultDate.setFullYear(resultDate.getFullYear() + addYears);
    resultDate.setMonth(resultDate.getMonth() + addMonths);

    // Now add days, hours, minutes, seconds
    resultDate.setDate(resultDate.getDate() + addDays);
    resultDate.setHours(resultDate.getHours() + addHours);
    resultDate.setMinutes(resultDate.getMinutes() + addMins);
    resultDate.setSeconds(resultDate.getSeconds() + addSecs);

    // Build summary parts
    const parts = [];
    if (addYears) parts.push(`${addYears} year${addYears !== 1 ? 's' : ''}`);
    if (addMonths) parts.push(`${addMonths} month${addMonths !== 1 ? 's' : ''}`);
    if (addDays) parts.push(`${addDays} day${addDays !== 1 ? 's' : ''}`);
    if (addHours) parts.push(`${addHours} hour${addHours !== 1 ? 's' : ''}`);
    if (addMins) parts.push(`${addMins} minute${addMins !== 1 ? 's' : ''}`);
    if (addSecs) parts.push(`${addSecs} second${addSecs !== 1 ? 's' : ''}`);

    // Show result
    const resultCard = $('#da-result');
    resultCard.classList.remove('hidden', 'show');
    void resultCard.offsetWidth;
    resultCard.classList.add('show');

    $('#da-result-from').textContent = formatDateTime(startDate);
    $('#da-result-to').textContent = formatDateTime(resultDate);
    $('#da-result-day').textContent = DAYS[resultDate.getDay()];

    if (parts.length > 0) {
      $('#da-result-summary').textContent = `Added: ${parts.join(', ')}`;
    } else {
      $('#da-result-summary').textContent = 'No duration added — result is the same as the start date.';
    }
  }

  $('#btn-add-duration').addEventListener('click', addDuration);

  // Allow Enter in duration fields
  $$('#date-adder input').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addDuration();
    });
  });

  // ── Auto-run Day Finder on load ──
  findDay();
})();
