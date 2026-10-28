/* ==========================================================================
   Students — registers the module's screens with the frame (shell/pages.js).

   Each tab is the old console's page of the same job; an Indian school gets the
   rebuilt screens in its place, every other school keeps the old page until its
   turn. The address decides which screen:

     students/directory                    the list
     students/directory/new                the add form
     students/directory/{id}[/{tab}]       the record
     students/directory/{id}/edit          the edit form
     students/classes/sections             the sections
     students/classes/sections/{id}[/{tab}]  one section
     students/guardians                    the families; ?peek={id} is one guardian beside the list
     students/admissions                   the applications; ?peek={id} is one beside the list
     students/admissions/workspace         the old admissions workspace
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, St = OL.students;
  OL.pages.register("students", {
    template: ["T2", "T3", "T5"],
    when: St.when,
    draw: function (host, env) {
      var r = env.route || {};
      if (r.record === "new") St.form.draw(host, env, null);
      else if (r.record && r.recordTab === "edit") St.form.draw(host, env, r.record);
      else if (r.record) St.record.draw(host, env);
      else St.directory.draw(host, env);
    }
  });
  // the applications are the list; students/admissions/workspace is the old admissions workspace, which still does the rest (enquiries, assessments, the application itself)
  OL.pages.register("enrollment", {
    template: "T2",
    when: function (env) { return St.when(env) && !St.admissionsWorkspace(env); },
    draw: function (host, env) { St.admissions.drawList(host, env); }
  });
  OL.pages.register("guardians", {
    template: "T2",
    when: St.when,
    draw: function (host, env) { St.guardians.drawList(host, env); }
  });
  OL.pages.register("in-classes", {
    template: ["T2", "T3"],
    when: St.when,
    draw: function (host, env) { if ((env.route || {}).record) St.classes.drawRecord(host, env); else St.classes.drawList(host, env); }
  });
})();
