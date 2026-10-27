/* ==========================================================================
   Students › the quick look — the drawer a row of the Directory opens.

   The list stays where it is, the person stays in the list: ↑ and ↓ move to the
   next and previous student of the page behind, Esc closes, and the address says
   ?peek=stu_123 so a refresh keeps it. It shows what is wanted at a front desk
   (the three numbers, what is wrong, who to ring) and links to the whole record
   for the rest.

   St.peek.open({ env, id, ids(), onClose }) → { show(id), close() }
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  function open(o) {
    var env = o.env, API = St.api();
    var cur = null, tab = "about", rec = null, seq = 0, hd = null;

    function step(d) {
      var list = o.ids ? o.ids() : [], i = list.indexOf(cur), j = i + d;
      if (i < 0 || j < 0 || j >= list.length) return;
      show(list[j]);
    }
    function full() { var id = cur; if (hd) hd.close(); env.go(St.path(id)); }
    function edit() { var id = cur; if (hd) hd.close(); env.go(St.path(id, "edit")); }

    var editBtn = OL.ui.button.render({ label: t("students.edit"), icon: "pencil", variant: "secondary", onClick: edit });
    editBtn.hidden = true;
    var fullBtn = OL.ui.button.render({ label: t("drawer.open_full"), variant: "primary", onClick: full });

    function paint() {
      if (!hd) return;
      if (!rec) return;
      var s = rec.student, body = h("div", { class: "st-peek" });
      var pills = h("div", { class: "st-peek__pills" });
      pills.appendChild(OL.ui.pill.render({ status: s.status === "left" ? "left" : "enrolled" }));
      var ap = St.attendancePill(s.attendance); if (ap) pills.appendChild(ap);
      var wp = St.warnPill(s.warning); if (wp) pills.appendChild(wp);
      body.appendChild(h("p", { class: "st-peek__sub", text: St.sub(s) }));
      body.appendChild(pills);
      var al = St.alerts(rec); if (al) body.appendChild(al);
      body.appendChild(St.tiles(rec));
      var gaps = St.gaps(rec, env); if (gaps) body.appendChild(gaps);
      body.appendChild(tab === "contacts" ? St.contacts(rec, env) : St.about(rec));
      var active = document.activeElement;
      var keep = !active || active === document.body || hd.el.contains(active);
      hd.setBody(body);
      editBtn.hidden = !rec.can.write;
      var link = hd.el.querySelector(".ol-drawer__full");
      if (link) link.setAttribute("href", St.href(env, cur));
      if (keep) hd.bodyEl.focus({ preventScroll: true });
    }

    function show(id) {
      cur = id; rec = null;
      var n = ++seq;
      OL.url.set("peek", id, { replace: true });
      if (!hd) create(id);
      hd.setBody(OL.ui.skeleton.render({ type: "lines", n: 8 }));
      API.directory.record(id).then(function (r) {
        if (n !== seq || !hd) return;
        rec = r; hd.setTitle(r.student.name); paint();
        OL.announce(r.student.name);
      }, function (e) {
        if (n !== seq || !hd) return;
        var retry = OL.ui.button.render({ label: t("common.retry"), variant: "secondary", size: "sm", onClick: function () { show(id); } });
        hd.setBody(e && e.status === 403 ? OL.ui.empty.render({ kind: "denied", title: t("students.denied"), text: t("students.denied_text") })
          : OL.ui.banner.render({ tone: e && e.code === "offline" ? "offline" : "danger", text: St.message(e), actions: retry }));
      });
    }

    function create(id) {
      hd = OL.ui.drawer.open({
        title: t("students.peek_title"), width: 720, activeTab: tab,
        tabs: [{ key: "about", label: t("students.peek.about") }, { key: "contacts", label: t("students.peek.contacts") }],
        onTab: function (k) { tab = k; paint(); },
        body: OL.ui.skeleton.render({ type: "lines", n: 8 }), url: { param: "peek", value: id },
        onStep: step, openFull: { href: St.href(env, id), onClick: function (e) { if (e && (e.metaKey || e.ctrlKey || e.shiftKey)) return; if (e) e.preventDefault(); full(); } },
        footer: [editBtn, fullBtn],
        onClose: function () { hd = null; seq++; if (o.onClose) o.onClose(); }
      });
    }

    show(o.id);
    return { show: show, close: function () { if (hd) hd.close(); } };
  }

  St.peek = { open: open };
})();
