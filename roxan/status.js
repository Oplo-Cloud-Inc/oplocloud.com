/* Status: what can be tested from this browser, right now. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const set = (k, state, note) => { const s = $('s-' + k); s.replaceChildren(Object.assign(document.createElement('b'), { textContent: state })); $('n-' + k).textContent = note; };

  async function gateway() {
    const t0 = performance.now();
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      if (j.gateway === 'open') set('gateway', 'Working', `Answered in ${ms} ms, with a model connected.`);
      else set('gateway', 'Not connected', `Answered in ${ms} ms, but no model is connected yet, so Roxan cannot reply.`);
    } catch (e) {
      set('gateway', 'Unreachable', navigator.onLine ? 'The gateway did not answer.' : 'This device appears to be offline.');
    }
  }

  function storage() {
    return new Promise(done => {
      let q;
      try { q = indexedDB.open('roxan-status-probe'); } catch (e) { q = null; }
      if (!q) return done(set('storage', 'Blocked', 'This browser will not keep data for this site, so Roxan would forget everything on close.'));
      q.onsuccess = () => { q.result.close(); indexedDB.deleteDatabase('roxan-status-probe'); done(set('storage', 'Working', 'This browser can keep your history on this device.')); };
      q.onerror = () => done(set('storage', 'Blocked', 'This browser will not keep data for this site (private browsing?), so Roxan would forget everything on close.'));
    });
  }

  function notifications() {
    if (!('Notification' in window)) return set('notify', 'Unsupported', 'This browser cannot show notifications. Reminders will appear inside Roxan.');
    const p = Notification.permission;
    if (p === 'granted') set('notify', 'Allowed', 'Reminders can notify you while Roxan is open.');
    else if (p === 'denied') set('notify', 'Blocked', 'Notifications are blocked for this site. Reminders will appear inside Roxan.');
    else set('notify', 'Not asked', 'Roxan asks the first time you approve a reminder.');
  }

  async function run() {
    notifications();
    await Promise.all([gateway(), storage()]);
    $('when').textContent = 'Checked ' + new Date().toLocaleTimeString();
  }
  $('recheck').addEventListener('click', run);
  run();
})();
