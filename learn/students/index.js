/* ==========================================================================
   Students — registers the module's screens with the frame (shell/pages.js).

   The Directory tab is the old console's "students" page; an Indian school gets
   the rebuilt screens in its place, every other school keeps the old page until
   its turn. The address decides which screen:

     students/directory                    the list
     students/directory/new                the add form
     students/directory/{id}[/{tab}]       the record
     students/directory/{id}/edit          the edit form
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
})();
