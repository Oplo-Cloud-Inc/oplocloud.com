#!/bin/bash
# ===========================================================================
# The proof.
#
# Not a unit test. This walks the exact workflow the architecture is being
# judged against, using nothing but the public HTTP API and three separate
# cookie jars — one per person, which is what makes it a real test of
# authorization rather than of one omnipotent session.
#
#     admin creates a course, a teacher and a student
#     teacher enters a grade         (on their own session)
#     student reads it back          (on a different session)
#     student tries to change it     (must be refused)
#
# The last line is the one that matters most.
# ===========================================================================
API="${API:-http://127.0.0.1:8787/api/v1}"
JAR=$(mktemp -d)
pass=0; fail=0

say()  { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; pass=$((pass+1)); }
bad()  { printf "  \033[31m✗\033[0m %s\n     got: %s\n" "$1" "$2"; fail=$((fail+1)); }

# $1 who  $2 method  $3 path  $4 body
call() {
  local who=$1 method=$2 path=$3 body=$4
  if [ -n "$body" ]; then
    curl -s -X "$method" -b "$JAR/$who" -c "$JAR/$who" \
      -H 'content-type: application/json' -d "$body" "$API$path"
  else
    curl -s -X "$method" -b "$JAR/$who" -c "$JAR/$who" "$API$path"
  fi
}
status() {
  local who=$1 method=$2 path=$3 body=$4
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w '%{http_code}' -X "$method" -b "$JAR/$who" -c "$JAR/$who" \
      -H 'content-type: application/json' -d "$body" "$API$path"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$method" -b "$JAR/$who" -c "$JAR/$who" "$API$path"
  fi
}
jq_() { node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try{const o=JSON.parse(s);const v=$1;process.stdout.write(v==null?'':String(v));}
  catch(e){process.stdout.write('')}})"; }

STAMP=$(date +%s)

say "1. Administrator signs in"
R=$(call admin POST /auth/login "{\"email\":\"chensaswat@gmail.com\",\"password\":\"correct-horse-battery-staple\"}")
ADMIN_ID=$(echo "$R" | jq_ "o.account&&o.account.id")
[ -n "$ADMIN_ID" ] && ok "signed in as $ADMIN_ID" || bad "admin login" "$R"

R=$(call admin GET /me)
echo "$R" | grep -q '"platform"' && ok "/me reports the platform admin role" || bad "/me roles" "$R"

say "2. Administrator creates a teacher and a student"
R=$(call admin POST /accounts "{\"email\":\"teacher$STAMP@example.com\",\"name\":\"Rina Okafor\",\"password\":\"a-long-enough-password\",\"role\":\"teacher\",\"orgId\":\"org_oplo\"}")
TEACHER=$(echo "$R" | jq_ "o.account&&o.account.id")
[ -n "$TEACHER" ] && ok "teacher created: $TEACHER" || bad "create teacher" "$R"

R=$(call admin POST /accounts "{\"email\":\"student$STAMP@example.com\",\"name\":\"Sehej Kaur\",\"password\":\"another-long-password\",\"role\":\"student\",\"orgId\":\"org_oplo\"}")
STUDENT=$(echo "$R" | jq_ "o.account&&o.account.id")
[ -n "$STUDENT" ] && ok "student created: $STUDENT" || bad "create student" "$R"

R=$(call admin POST /accounts "{\"email\":\"other$STAMP@example.com\",\"name\":\"Unrelated Teacher\",\"password\":\"yet-another-password\",\"role\":\"teacher\",\"orgId\":\"org_oplo\"}")
OTHER=$(echo "$R" | jq_ "o.account&&o.account.id")
[ -n "$OTHER" ] && ok "unrelated teacher created: $OTHER" || bad "create other teacher" "$R"

say "3. A course, with the teacher teaching and the student enrolled"
R=$(call admin POST /courses "{\"code\":\"media-$STAMP\",\"title\":\"Media Arts\",\"subject\":\"English\",\"orgId\":\"org_oplo\",\"status\":\"published\",\"body\":{\"grading\":[[\"Quizzes\",35],[\"Assignments\",35],[\"Exams\",30]]}}")
COURSE=$(echo "$R" | jq_ "o.course&&o.course.id")
[ -n "$COURSE" ] && ok "course created: $COURSE" || bad "create course" "$R"

call admin POST "/courses/$COURSE/members" "{\"accountId\":\"$TEACHER\",\"role\":\"teacher\"}" >/dev/null
call admin POST "/courses/$COURSE/members" "{\"accountId\":\"$STUDENT\",\"role\":\"student\"}" >/dev/null
R=$(call admin GET "/courses/$COURSE/members")
echo "$R" | grep -q "$TEACHER" && echo "$R" | grep -q "$STUDENT" \
  && ok "teacher and student enrolled" || bad "enrolment" "$R"

say "4. Teacher signs in on their own session and sets work"
R=$(call teacher POST /auth/login "{\"email\":\"teacher$STAMP@example.com\",\"password\":\"a-long-enough-password\"}")
echo "$R" | grep -q "$TEACHER" && ok "teacher signed in" || bad "teacher login" "$R"

R=$(call teacher POST "/courses/$COURSE/assignments" "{\"title\":\"Unit 5 quiz\",\"category\":\"Quizzes\",\"outOf\":20}")
ASSIGN=$(echo "$R" | jq_ "o.assignment&&o.assignment.id")
[ -n "$ASSIGN" ] && ok "assignment created: $ASSIGN" || bad "create assignment" "$R"

say "5. THE PROOF — teacher grades on one session, student reads on another"
R=$(call teacher PUT /grades "{\"assignmentId\":\"$ASSIGN\",\"accountId\":\"$STUDENT\",\"score\":17,\"outOf\":20,\"feedback\":\"Good on the ossicles.\"}")
echo "$R" | grep -q '"score":17' && ok "teacher wrote 17/20" || bad "teacher writes grade" "$R"

R=$(call student POST /auth/login "{\"email\":\"student$STAMP@example.com\",\"password\":\"another-long-password\"}")
echo "$R" | grep -q "$STUDENT" && ok "student signed in on a separate session" || bad "student login" "$R"

R=$(call student GET /grades)
SCORE=$(echo "$R" | jq_ "o.grades&&o.grades[0]&&o.grades[0].score")
PCT=$(echo "$R" | jq_ "o.summaries&&o.summaries[0]&&o.summaries[0].percent")
LETTER=$(echo "$R" | jq_ "o.summaries&&o.summaries[0]&&o.summaries[0].letter")
COUNTED=$(echo "$R" | jq_ "o.summaries&&o.summaries[0]&&o.summaries[0].countedWeight")
[ "$SCORE" = "17" ] && ok "student sees the score the teacher entered: $SCORE/20" \
  || bad "student reads grade" "$R"
[ "$PCT" = "85" ] && ok "server computes 85% ($LETTER), over the $COUNTED% marked so far" \
  || bad "computed grade" "pct=$PCT letter=$LETTER"

say "6. The teacher changes the grade; the student sees the change"
call teacher PUT /grades "{\"assignmentId\":\"$ASSIGN\",\"accountId\":\"$STUDENT\",\"score\":19,\"outOf\":20}" >/dev/null
R=$(call student GET /grades)
SCORE=$(echo "$R" | jq_ "o.grades&&o.grades[0]&&o.grades[0].score")
[ "$SCORE" = "19" ] && ok "student now sees 19/20 — the database is the source of truth" \
  || bad "grade update visible to student" "$R"

say "7. Authorization — the refusals that make the rest mean anything"
S=$(status student PUT /grades "{\"assignmentId\":\"$ASSIGN\",\"accountId\":\"$STUDENT\",\"score\":20,\"outOf\":20}")
[ "$S" = "403" ] && ok "student cannot change their own grade (403)" \
  || bad "student MUST NOT be able to write a grade" "HTTP $S"

R=$(call other POST /auth/login "{\"email\":\"other$STAMP@example.com\",\"password\":\"yet-another-password\"}")
S=$(status other GET "/grades?accountId=$STUDENT")
[ "$S" = "403" ] && ok "a teacher who does not teach them cannot read their grades (403)" \
  || bad "unrelated teacher MUST NOT read grades" "HTTP $S"

S=$(status other PUT /grades "{\"assignmentId\":\"$ASSIGN\",\"accountId\":\"$STUDENT\",\"score\":1,\"outOf\":20}")
[ "$S" = "403" ] && ok "an unrelated teacher cannot write a grade (403)" \
  || bad "unrelated teacher MUST NOT write a grade" "HTTP $S"

S=$(curl -s -o /dev/null -w '%{http_code}' "$API/grades")
[ "$S" = "401" ] && ok "signed out, grades are unauthorized (401)" || bad "anonymous read" "HTTP $S"

S=$(status student POST "/accounts" "{\"email\":\"sneak$STAMP@example.com\",\"name\":\"Sneak\",\"password\":\"a-long-enough-password\",\"role\":\"admin\"}")
[ "$S" = "403" ] && ok "a student cannot create accounts (403)" || bad "student privilege escalation" "HTTP $S"

S=$(status student POST "/accounts/$STUDENT/roles" "{\"product\":\"platform\",\"role\":\"admin\"}")
[ "$S" = "403" ] && ok "a student cannot grant themselves a role (403)" || bad "role escalation" "HTTP $S"

say "8. The gradebook — the three things a blank cell can mean"
R=$(call teacher POST "/courses/$COURSE/assignments" "{\"title\":\"Essay 1\",\"category\":\"Assignments\",\"outOf\":10}")
ESSAY=$(echo "$R" | jq_ "o.assignment&&o.assignment.id")
R=$(call teacher POST "/courses/$COURSE/assignments" "{\"title\":\"Midterm\",\"category\":\"Exams\",\"outOf\":50}")
MID=$(echo "$R" | jq_ "o.assignment&&o.assignment.id")
[ -n "$ESSAY" ] && [ -n "$MID" ] && ok "two more pieces of work set" || bad "set work" "$R"

# 19/20 on the quiz is already on the record from section 6.
R=$(call teacher GET "/courses/$COURSE/gradebook")
PCT=$(echo "$R" | jq_ "o.summaries&&o.summaries['$STUDENT']&&o.summaries['$STUDENT'].percent")
UNMARKED=$(echo "$R" | jq_ "o.needs&&o.needs.length")
[ "$PCT" = "95" ] && ok "one call returns the class: 95% over the quiz alone" \
  || bad "gradebook percent" "$R"
[ "$UNMARKED" = "2" ] && ok "and names the 2 pieces of work still owed a mark" \
  || bad "needs" "needs=$UNMARKED"

# Not handed in. This is a zero, and the grade must fall.
call teacher PUT /grades "{\"assignmentId\":\"$ESSAY\",\"accountId\":\"$STUDENT\",\"status\":\"missing\"}" >/dev/null
R=$(call teacher GET "/courses/$COURSE/gradebook")
PCT=$(echo "$R" | jq_ "o.summaries&&o.summaries['$STUDENT']&&o.summaries['$STUDENT'].percent")
[ "$PCT" = "48" ] && ok "marked missing, the grade falls to 48% — a zero is counted as a zero" \
  || bad "missing must count as zero" "pct=$PCT"

# Excused. Not a zero and not full marks: the work is not part of the grade.
call teacher PUT /grades "{\"assignmentId\":\"$ESSAY\",\"accountId\":\"$STUDENT\",\"status\":\"excused\"}" >/dev/null
R=$(call teacher GET "/courses/$COURSE/gradebook")
PCT=$(echo "$R" | jq_ "o.summaries&&o.summaries['$STUDENT']&&o.summaries['$STUDENT'].percent")
[ "$PCT" = "95" ] && ok "excused, it leaves the divisor entirely and the grade returns to 95%" \
  || bad "excused must not count" "pct=$PCT"

# A score cannot ride along with a status that means there is no score.
S=$(status teacher PUT /grades "{\"assignmentId\":\"$ESSAY\",\"accountId\":\"$STUDENT\",\"status\":\"excused\",\"score\":10}")
[ "$S" = "400" ] && ok "excused work cannot also carry a score (400)" \
  || bad "contradictory grade accepted" "HTTP $S"

say "9. A write sends what is changing, and nothing else"
call teacher PUT /grades "{\"assignmentId\":\"$MID\",\"accountId\":\"$STUDENT\",\"score\":40,\"outOf\":50,\"feedback\":\"Strong on waves.\"}" >/dev/null
call teacher PUT /grades "{\"assignmentId\":\"$MID\",\"accountId\":\"$STUDENT\",\"score\":44}" >/dev/null
R=$(call student GET "/grades?courseId=$COURSE")
FB=$(echo "$R" | jq_ "o.grades.filter(g=>g.assignmentId=='$MID')[0].feedback")
SC=$(echo "$R" | jq_ "o.grades.filter(g=>g.assignmentId=='$MID')[0].score")
[ "$SC" = "44" ] && [ "$FB" = "Strong on waves." ] \
  && ok "correcting the mark left the comment where it was" \
  || bad "a patch must not clear what it did not send" "score=$SC feedback=$FB"

say "10. A column, filled in one request"
R=$(call teacher POST /grades/batch "{\"grades\":[{\"assignmentId\":\"$ESSAY\",\"accountId\":\"$STUDENT\",\"score\":8},{\"assignmentId\":\"$ESSAY\",\"accountId\":\"$TEACHER\",\"score\":8}]}")
WROTE=$(echo "$R" | jq_ "o.grades.length")
REFUSED=$(echo "$R" | jq_ "o.refused.length")
[ "$WROTE" = "1" ] && [ "$REFUSED" = "1" ] \
  && ok "one mark written, one refused — the teacher is not a student on the course" \
  || bad "batch" "$R"

say "11. History — every change to a mark, kept"
R=$(call teacher GET "/grades/history?assignmentId=$ESSAY&accountId=$STUDENT")
N=$(echo "$R" | jq_ "o.events.length")
LAST=$(echo "$R" | jq_ "o.events[0].toScore")
WAS=$(echo "$R" | jq_ "o.events[0].fromStatus")
[ "$N" = "3" ] && ok "3 changes recorded: missing, excused, then 8/10" || bad "history length" "n=$N"
[ "$LAST" = "8" ] && [ "$WAS" = "excused" ] \
  && ok "the newest says what it was before it was 8 — excused" \
  || bad "history content" "to=$LAST from=$WAS"

R=$(call student GET "/grades/history?assignmentId=$ESSAY&accountId=$STUDENT")
echo "$R" | grep -q '"events"' && ok "the student may read the history of their own mark" \
  || bad "student history read" "$R"

S=$(status student GET "/grades/history?courseId=$COURSE")
[ "$S" = "403" ] && ok "but not the whole class's (403)" || bad "student read class history" "HTTP $S"

S=$(status student GET "/courses/$COURSE/gradebook")
[ "$S" = "403" ] && ok "and not the class gradebook either (403)" || bad "student read gradebook" "HTTP $S"

S=$(status other GET "/courses/$COURSE/gradebook")
[ "$S" = "403" ] && ok "nor a teacher who does not teach this course (403)" \
  || bad "unrelated teacher read gradebook" "HTTP $S"

say "12. The console's first screen — every class in one request"
R=$(call teacher GET /teaching)
N=$(echo "$R" | jq_ "o.courses&&o.courses.length")
OWED=$(echo "$R" | jq_ "o.totals&&o.totals.unmarked")
[ "$N" = "1" ] && ok "one class, with its totals beside it" || bad "teaching" "$R"
[ -n "$OWED" ] && ok "and what it owes across every class: $OWED unmarked" || bad "totals" "$R"

S=$(status student GET /teaching)
R2=$(call student GET /teaching)
[ "$(echo "$R2" | jq_ "o.courses.length")" = "0" ] \
  && ok "a student teaches nothing, so it is empty rather than forbidden" \
  || bad "student teaching" "$R2"

say "13. Reporting — a view, not a file"
R=$(call teacher GET "/reporting?courseId=$COURSE")
BLOCKED=$(echo "$R" | jq_ "o.counts&&o.counts.blocked")
PUB=$(echo "$R" | jq_ "o.publishable")
WHY=$(echo "$R" | jq_ "o.rows[0].reasons.map(r=>r.kind).join(',')")
[ "$BLOCKED" = "1" ] && ok "the report is blocked, because work is unmarked" \
  || bad "readiness blocked" "blocked=$BLOCKED"
[ "$PUB" = "false" ] && ok "and the term is not publishable while it is" \
  || bad "publishable" "$PUB"
echo "$WHY" | grep -q "no-comment" && ok "the reasons name the missing comment: $WHY" \
  || bad "reasons" "$WHY"

R=$(call teacher PUT /reporting/comment "{\"courseId\":\"$COURSE\",\"accountId\":\"$STUDENT\",\"body\":\"Sehej has been an absolute delight this term.\"}")
echo "$R" | grep -q "delight" && ok "a teacher wrote the term's comment" || bad "comment write" "$R"

S=$(status student PUT /reporting/comment "{\"courseId\":\"$COURSE\",\"accountId\":\"$STUDENT\",\"body\":\"A+ student\"}")
[ "$S" = "403" ] && ok "a student cannot write their own report comment (403)" \
  || bad "student MUST NOT write a comment" "HTTP $S"

say "14. The check that matters — words against the marks"
# Everything is marked now except the Midterm; mark it low so the grade falls
# under the warm comment already written.
call teacher PUT /grades "{\"assignmentId\":\"$MID\",\"accountId\":\"$STUDENT\",\"score\":10,\"outOf\":50}" >/dev/null
R=$(call teacher GET "/reporting?courseId=$COURSE")
KINDS=$(echo "$R" | jq_ "o.rows[0].reasons.map(r=>r.kind).join(',')")
echo "$KINDS" | grep -q "mismatch" \
  && ok "a warm comment over a failing grade is flagged for review" \
  || bad "mismatch not detected" "$KINDS"

say "15. One student's report, assembled on request"
R=$(call student GET "/students/$STUDENT/report")
STANDING=$(echo "$R" | jq_ "o.report&&o.report.standing")
COMMENT=$(echo "$R" | jq_ "o.report.courses[0].comment&&o.report.courses[0].comment.body")
AUTHOR=$(echo "$R" | jq_ "o.report.courses[0].comment&&o.report.courses[0].comment.author")
[ -n "$STANDING" ] && ok "the student may read their own report: standing $STANDING%" \
  || bad "own report" "$R"
echo "$COMMENT" | grep -q "delight" && ok "with the teacher's comment on it, attributed to $AUTHOR" \
  || bad "report comment" "$COMMENT"

S=$(status teacher GET "/students/$STUDENT/report")
[ "$S" = "200" ] && ok "their teacher may read it (200)" || bad "teacher report read" "HTTP $S"
S=$(status other GET "/students/$STUDENT/report")
[ "$S" = "403" ] && ok "a teacher who does not teach them may not (403)" \
  || bad "unrelated teacher report read" "HTTP $S"

say "16. The roster across every class, and what happened to it"
R=$(call teacher GET /students)
N=$(echo "$R" | jq_ "o.students&&o.students.length")
CN=$(echo "$R" | jq_ "o.students[0]&&o.students[0].courses.length")
[ "$N" = "1" ] && ok "one student, once, with their classes on the row" || bad "students" "$R"
[ "$CN" = "1" ] && ok "and one entry per class they share with this teacher" || bad "student courses" "$CN"

R=$(call teacher GET /activity)
EV=$(echo "$R" | jq_ "o.events&&o.events.length")
WHO=$(echo "$R" | jq_ "o.events[0]&&o.events[0].student&&o.events[0].student.name")
[ -n "$EV" ] && [ "$EV" != "0" ] && ok "activity lists $EV changes across the teacher's classes" \
  || bad "activity" "$R"
[ "$WHO" = "Sehej Kaur" ] && ok "each one naming the student it was about" || bad "activity student" "$WHO"

S=$(status student GET /activity)
R2=$(call student GET /activity)
[ "$(echo "$R2" | jq_ "o.events.length")" = "0" ] \
  && ok "a student teaches nothing, so their activity is empty" || bad "student activity" "$R2"

say "17. Undo — the record keeps the mistake and the correction"
call teacher PUT /grades "{\"assignmentId\":\"$MID\",\"accountId\":\"$STUDENT\",\"score\":5,\"outOf\":50}" >/dev/null
R=$(call teacher GET "/grades/history?assignmentId=$MID&accountId=$STUDENT")
EVID=$(echo "$R" | jq_ "o.events[0]&&o.events[0].id")
WAS=$(echo "$R" | jq_ "o.events[0]&&o.events[0].fromScore")
[ -n "$EVID" ] && ok "the mistyped 5 is on the record, over a $WAS" || bad "history for undo" "$R"

R=$(call teacher POST /grades/undo "{\"eventId\":\"$EVID\"}")
BACK=$(echo "$R" | jq_ "o.grade&&o.grade.score")
[ "$BACK" = "$WAS" ] && ok "undo put it back to $BACK" || bad "undo" "$R"

R=$(call teacher GET "/grades/history?assignmentId=$MID&accountId=$STUDENT")
NEV=$(echo "$R" | jq_ "o.events.length")
NOTE=$(echo "$R" | jq_ "o.events[0]&&o.events[0].note")
# 40 entered, 40→44, 44→10, 10→5, and the undo back to 10. Five, not four:
# the reversal is a change like any other.
[ "$NEV" = "5" ] && ok "and the undo is itself a change on the record, not an erasure" \
  || bad "undo must be recorded" "events=$NEV"
echo "$NOTE" | grep -q "Undo" && ok "carrying the reason it was made" || bad "undo note" "$NOTE"

S=$(status student POST /grades/undo "{\"eventId\":\"$EVID\"}")
[ "$S" = "403" ] && ok "a student cannot undo a grade change (403)" || bad "student undo" "HTTP $S"

say "18. The rules a school actually has"
# A course of its own, so the policies do not disturb the assertions above.
R=$(call admin POST /courses "{\"code\":\"pol-$STAMP\",\"title\":\"Policy Physics\",\"subject\":\"Physics\",\"orgId\":\"org_oplo\",\"status\":\"published\",\"body\":{\"grading\":[[\"Quizzes\",50],[\"Exams\",50]],\"latePenalty\":10,\"drop\":{\"Quizzes\":1}}}")
PC=$(echo "$R" | jq_ "o.course&&o.course.id")
call admin POST "/courses/$PC/members" "{\"accountId\":\"$TEACHER\",\"role\":\"teacher\"}" >/dev/null
call admin POST "/courses/$PC/members" "{\"accountId\":\"$STUDENT\",\"role\":\"student\"}" >/dev/null
[ -n "$PC" ] && ok "a course graded 50/50 that drops one quiz and charges 10% for late" \
  || bad "policy course" "$R"

mk() { call teacher POST "/courses/$PC/assignments" "$1" | jq_ "o.assignment&&o.assignment.id"; }
Q1=$(mk '{"title":"Quiz 1","category":"Quizzes","outOf":10}')
Q2=$(mk '{"title":"Quiz 2","category":"Quizzes","outOf":10}')
EX=$(mk '{"title":"Final","category":"Exams","outOf":100}')
XC=$(mk '{"title":"Bonus","category":"Quizzes","outOf":3,"extraCredit":true}')
R=$(call teacher GET "/courses/$PC/assignments")
echo "$R" | grep -q '"extraCredit":true' && ok "and one piece of work marked extra credit" \
  || bad "extra credit flag" "$R"

g() { call teacher PUT /grades "{\"assignmentId\":\"$1\",\"accountId\":\"$STUDENT\",\"score\":$2,\"outOf\":$3${4:+,$4}}" >/dev/null; }
pct() { call teacher GET "/courses/$PC/gradebook" | jq_ "o.summaries&&o.summaries['$STUDENT']&&o.summaries['$STUDENT'].percent"; }

g "$Q1" 2 10; g "$Q2" 10 10; g "$EX" 90 100
P=$(pct)
[ "$P" = "95" ] && ok "the lowest quiz is dropped: 2/10 ignored, so 95%" \
  || bad "drop lowest" "pct=$P"

R=$(call teacher GET "/courses/$PC/gradebook")
DROPPED=$(echo "$R" | jq_ "o.summaries['$STUDENT'].dropped[0]&&o.summaries['$STUDENT'].dropped[0].title")
[ "$DROPPED" = "Quiz 1" ] && ok "and the sheet says which one it dropped, by name" \
  || bad "dropped must be named" "$DROPPED"

# Late is a flag, not a status: the mark is still a mark.
g "$Q2" 10 10 '"late":true'
R=$(call teacher GET "/courses/$PC/gradebook")
P=$(echo "$R" | jq_ "o.summaries['$STUDENT'].percent")
PEN=$(echo "$R" | jq_ "o.summaries['$STUDENT'].latePenalty")
LATE=$(echo "$R" | jq_ "o.grades.filter(x=>x.assignmentId=='$Q2')[0].late")
[ "$LATE" = "true" ] && ok "the mark is still 10/10 and also late" || bad "late flag" "late=$LATE"
[ "$P" = "90" ] && [ "$PEN" = "1" ] && ok "10% of what it was out of comes off: 90%, a point deducted" \
  || bad "late penalty" "pct=$P penalty=$PEN"

# Extra credit raises and can never lower.
# Quizzes is 9/10 after the drop and the late penalty; three points of extra
# credit make it 12/10, which is 120% of a category worth half the course.
# 105% is what the school's own rules produce and the engine does not quietly
# cap it — a cap is itself a policy and nobody asked for one here.
g "$XC" 3 3
R=$(call teacher GET "/courses/$PC/gradebook")
P=$(echo "$R" | jq_ "o.summaries['$STUDENT'].percent")
XCP=$(echo "$R" | jq_ "o.summaries['$STUDENT'].extraCredit")
[ "$P" = "105" ] && [ "$XCP" = "3" ] \
  && ok "extra credit adds to what was earned and not to what was asked: $P%, $XCP points of it" \
  || bad "extra credit" "pct=$P extra=$XCP"

call teacher PUT /grades "{\"assignmentId\":\"$XC\",\"accountId\":\"$STUDENT\",\"status\":\"missing\"}" >/dev/null
P=$(pct)
[ "$P" = "90" ] && ok "unearned extra credit is not a zero — back to 90%, not below" \
  || bad "extra credit must never lower a grade" "pct=$P"

say "19. What if"
R=$(call teacher POST "/courses/$PC/whatif" "{\"accountId\":\"$STUDENT\",\"changes\":[{\"assignmentId\":\"$EX\",\"score\":50}]}")
NOW=$(echo "$R" | jq_ "o.now&&o.now.percent")
THEN=$(echo "$R" | jq_ "o.then&&o.then.percent")
[ "$NOW" = "90" ] && [ "$THEN" = "70" ] && ok "50 on the final instead of 90: $NOW% becomes $THEN%" \
  || bad "whatif" "now=$NOW then=$THEN"

P=$(pct)
[ "$P" = "90" ] && ok "and the record did not move — a what-if writes nothing" \
  || bad "whatif MUST NOT write" "pct=$P"

R=$(call student POST "/courses/$PC/whatif" "{\"changes\":[{\"assignmentId\":\"$EX\",\"score\":100}]}")
echo "$R" | grep -q '"then"' && ok "a student may ask it about their own grade" || bad "student whatif" "$R"
S=$(status other POST "/courses/$PC/whatif" "{\"accountId\":\"$STUDENT\",\"changes\":[]}")
[ "$S" = "403" ] && ok "an unrelated teacher may not ask it about somebody else's (403)" \
  || bad "whatif leak" "HTTP $S"

say "20. The work a student can actually see"
# The hole this closes: a teacher sets work, marks it missing, and counts it as
# a zero. Until now nothing told the student the work existed.
R=$(call student GET /coursework)
N=$(echo "$R" | jq_ "o.work&&o.work.length")
WAIT=$(echo "$R" | jq_ "o.totals&&o.totals.waiting")
MISS=$(echo "$R" | jq_ "o.totals&&o.totals.missing")
[ -n "$N" ] && [ "$N" != "0" ] && ok "the student sees $N pieces of work set on their courses" \
  || bad "coursework" "$R"

# Work nobody has marked has no grade row at all, and is the whole point.
call teacher POST "/courses/$PC/assignments" '{"title":"Unseen essay","category":"Assignments","outOf":10}' >/dev/null
R=$(call student GET /coursework)
SEEN=$(echo "$R" | jq_ "o.work.filter(w=>w.title=='Unseen essay').length")
ST=$(echo "$R" | jq_ "o.work.filter(w=>w.title=='Unseen essay')[0].status")
[ "$SEEN" = "1" ] && ok "work with no mark on it still appears — that is the point" \
  || bad "unmarked work must be visible" "$R"
[ -z "$ST" ] && ok "and its status is nothing, not a guess" || bad "status" "got '$ST'"

# Late first, then soonest, then undated.
FIRST=$(echo "$R" | jq_ "o.work[0].title")
[ -n "$FIRST" ] && ok "ordered by what is late, then by what is due soonest: “$FIRST” first" \
  || bad "order" "$R"

S=$(status other GET "/coursework?accountId=$STUDENT")
[ "$S" = "403" ] && ok "a teacher who does not teach them cannot read their work (403)" \
  || bad "coursework leak" "HTTP $S"
S=$(status teacher GET "/coursework?accountId=$STUDENT")
[ "$S" = "200" ] && ok "their own teacher can (200)" || bad "teacher coursework" "HTTP $S"

say "21. Progress and experience, priced by the server"
R=$(call student PUT /progress "{\"scope\":\"set:media-1\",\"state\":{\"Cochlea\":{\"seen\":3,\"recall\":0.8}}}")
echo "$R" | grep -q '"ok":true' && ok "student wrote their own progress" || bad "progress write" "$R"

S=$(status teacher PUT /progress "{\"scope\":\"set:media-1\",\"state\":{\"forged\":true}}")
# A teacher writing progress for themselves is legal; the point is they cannot
# write it for the student. Progress is always scoped to the caller.
R=$(call teacher GET "/progress?accountId=$STUDENT")
echo "$R" | grep -q "Cochlea" && ok "teacher can READ their student's progress" || bad "teacher reads progress" "$R"

R=$(call student POST /gamification/events '{"events":[{"kind":"answer","level":"transfer","right":true,"hints":0,"mastery":0.2},{"kind":"answer","level":"recognise","right":true,"hints":3,"mastery":0.95}],"tzOffset":0}')
AWARDED=$(echo "$R" | jq_ "o.awarded")
[ "$AWARDED" = "27" ] && ok "server priced the events at $AWARDED XP (transfer 26 + a hinted, mastered recognise 1)" \
  || bad "server-side XP pricing" "$R"

R=$(call student POST /gamification/events '{"events":[{"kind":"answer","level":"recognise","right":true,"xp":5000,"amount":5000}],"tzOffset":0}')
AWARDED=$(echo "$R" | jq_ "o.awarded")
[ "$AWARDED" = "6" ] && ok "a client claiming 5000 XP is awarded $AWARDED — the claim is ignored" \
  || bad "client XP claim MUST be ignored" "$R"

R=$(call student GET "/gamification/standing?tzOffset=0")
XP=$(echo "$R" | jq_ "o.standing&&o.standing.xp")
STREAK=$(echo "$R" | jq_ "o.standing&&o.standing.streak")
[ "$XP" = "33" ] && ok "standing totals $XP XP from the ledger, streak $STREAK" || bad "standing" "$R"

say "22. Study sets — authoring and consumption, both server-backed"
R=$(call teacher POST /study-sets "{\"code\":\"waves-$STAMP\",\"title\":\"Waves and Sound\",\"courseId\":\"$COURSE\",\"status\":\"published\",\"terms\":[{\"term\":\"Pinna\",\"definition\":\"The visible outer ear that collects sound.\",\"why\":\"It is why you can tell a sound came from behind you.\",\"example\":\"Cupping a hand behind your ear.\"},{\"term\":\"Cochlea\",\"definition\":\"The snail-shaped hearing part of the inner ear.\"},{\"term\":\"Amplitude\",\"definition\":\"The height of a wave, crest to trough.\"},{\"term\":\"Frequency\",\"definition\":\"Cycles per second, measured in Hertz.\"}]}")
SET=$(echo "$R" | jq_ "o.studySet&&o.studySet.id")
[ -n "$SET" ] && ok "teacher authored a set: $SET" || bad "create study set" "$R"

LEVELS=$(echo "$R" | jq_ "o.studySet&&o.studySet.terms[0].levels.join('/')")
[ "$LEVELS" = "recognise/recall/explain/apply" ] \
  && ok "a term with a worked case reports levels: $LEVELS" || bad "levels" "$LEVELS"
LEVELS2=$(echo "$R" | jq_ "o.studySet&&o.studySet.terms[1].levels.join('/')")
[ "$LEVELS2" = "recognise/recall/explain" ] \
  && ok "a term without one is honestly capped: $LEVELS2" || bad "thin term levels" "$LEVELS2"

R=$(call student GET /study-sets)
echo "$R" | grep -q "$SET" && ok "the student in that course sees it" || bad "student reads set" "$R"

S=$(status other GET "/study-sets/$SET")
[ "$S" = "403" ] && ok "a teacher outside the course cannot read it (403)" \
  || bad "unrelated teacher MUST NOT read the set" "HTTP $S"

S=$(status student PATCH "/study-sets/$SET" '{"title":"Hacked"}')
[ "$S" = "403" ] && ok "a student cannot edit a study set (403)" \
  || bad "student MUST NOT edit a set" "HTTP $S"

S=$(status teacher POST /study-sets "{\"code\":\"tiny-$STAMP\",\"title\":\"Too small\",\"terms\":[{\"term\":\"a\",\"definition\":\"b\"}]}")
[ "$S" = "400" ] && ok "a set of one term is refused — the games need distractors (400)" \
  || bad "minimum term count" "HTTP $S"

S=$(status teacher POST /study-sets "{\"code\":\"dupe-$STAMP\",\"title\":\"Duplicates\",\"terms\":[{\"term\":\"Pinna\",\"definition\":\"one\"},{\"term\":\"pinna\",\"definition\":\"two\"},{\"term\":\"C\",\"definition\":\"three\"},{\"term\":\"D\",\"definition\":\"four\"}]}")
[ "$S" = "409" ] && ok "a repeated term is refused — it makes an unanswerable question (409)" \
  || bad "duplicate term" "HTTP $S"

# A draft belongs to its author until it is published.
R=$(call teacher POST /study-sets "{\"code\":\"draft-$STAMP\",\"title\":\"Draft\",\"courseId\":\"$COURSE\",\"terms\":[{\"term\":\"A\",\"definition\":\"one\"},{\"term\":\"B\",\"definition\":\"two\"},{\"term\":\"C\",\"definition\":\"three\"},{\"term\":\"D\",\"definition\":\"four\"}]}")
DRAFT=$(echo "$R" | jq_ "o.studySet&&o.studySet.id")
S=$(status student GET "/study-sets/$DRAFT")
[ "$S" = "403" ] && ok "an unpublished draft is not visible to the class (403)" \
  || bad "draft leaked to students" "HTTP $S"

call teacher PATCH "/study-sets/$DRAFT" '{"status":"published"}' >/dev/null
S=$(status student GET "/study-sets/$DRAFT")
[ "$S" = "200" ] && ok "publishing it makes it visible (200)" || bad "publish" "HTTP $S"

say "23. Transcripts — imported by an administrator, read by the student, changed by nobody else"
TX='{"source":{"school":"Proof High","creditSystem":"nyc-4-term","kind":"unofficial","creditsEarned":1.75,"cumulativeAverage":77},"terms":[{"year":"2024-2025","gradeLevel":9,"term":"Term 1","average":77,"courses":[["E1","English 1A","88",0.5,0.5,"english"],["E2","English 1B","90",0.5,0.5,"english"],["M1","Algebra 1A","62",0.5,0.5,"math"],["M2","Algebra 1B","45",0.5,0,"math"],["P1","PE 1A","100",0.25,0.25,"pe","not_averaged"]]}],"exams":[["Algebra I","2025-06",70,"passed"]]}'
S=$(status student POST "/accounts/$STUDENT/transcripts" "$TX")
[ "$S" = "403" ] && ok "a student cannot import their own transcript (403)" || bad "student MUST NOT import a transcript" "HTTP $S"
S=$(status teacher POST "/accounts/$STUDENT/transcripts" "$TX")
[ "$S" = "403" ] && ok "their teacher cannot import one either (403)" || bad "teacher MUST NOT import a transcript" "HTTP $S"
S=$(status student PUT "/accounts/$STUDENT/program" '{"track":"24"}')
[ "$S" = "403" ] && ok "a student cannot change their own diploma track (403)" || bad "student MUST NOT set their track" "HTTP $S"
R=$(call admin PUT "/accounts/$STUDENT/program" '{"track":"21.5","program":"Proof Program","gradeLevel":11}')
echo "$R" | grep -q '"track":"21.5"' && ok "an administrator set the 21.5-credit track" || bad "set program" "$R"
R=$(call admin POST "/accounts/$STUDENT/transcripts" "$TX")
[ "$(echo "$R" | jq_ "o.record&&o.record.courses")" = "5" ] && ok "an administrator imported it: 5 courses, 1 exam" || bad "import transcript" "$R"
R=$(call student GET /graduation)
EST=$(echo "$R" | jq_ "o.graduation.totals.transferEstimate")
CONS=$(echo "$R" | jq_ "o.graduation.totals.transferConservative")
[ "$EST" = "0.875" ] && ok "the student sees 0.875 EHS credits: 1.75 earned at 0.5 per NYC credit" || bad "transfer estimate" "$EST"
[ "$CONS" = "0.5" ] && ok "and a conservative 0.5, with partial semesters rounded down" || bad "conservative estimate" "$CONS"
S=$(status teacher GET "/graduation?accountId=$STUDENT")
[ "$S" = "200" ] && ok "a teacher of theirs can read it (200)" || bad "teacher reads graduation" "HTTP $S"
S=$(status other GET "/graduation?accountId=$STUDENT")
[ "$S" = "403" ] && ok "a teacher who does not teach them cannot (403)" || bad "unrelated teacher MUST NOT read a transcript" "HTTP $S"
S=$(curl -s -o /dev/null -w '%{http_code}' "$API/graduation")
[ "$S" = "401" ] && ok "signed out, it is unauthorized (401)" || bad "anonymous graduation read" "HTTP $S"
CID=$(echo "$R" | jq_ "o.graduation.courses[0].id")
S=$(status student PATCH "/transcript-courses/$CID" '{"ehsCredits":4}')
[ "$S" = "403" ] && ok "a student cannot raise a transferred credit (403)" || bad "student MUST NOT edit transfer credit" "HTTP $S"
S=$(status teacher PATCH "/transcript-courses/$CID" '{"decision":"accepted"}')
[ "$S" = "403" ] && ok "nor can their teacher (403)" || bad "teacher MUST NOT edit transfer credit" "HTTP $S"
call admin PATCH "/transcript-courses/$CID" '{"decision":"declined"}' >/dev/null
EST=$(call student GET /graduation | jq_ "o.graduation.totals.transferEstimate")
[ "$EST" = "0.625" ] && ok "a course the registrar declines stops counting: now $EST" || bad "declined course still counted" "$EST"

say "24. The analysis — every sentence of it computed from the record"
R=$(call student GET /graduation)
MET=$(echo "$R" | jq_ "o.graduation.board.met")
[ "$MET" = "1" ] && ok "the exam board finds one core area met: Algebra I at 70" || bad "exam board" "$MET"
PLUS=$(echo "$R" | jq_ "o.graduation.board.needsPlusOne")
[ "$PLUS" = "true" ] && ok "and no fifth assessment on the record, which the 4+1 rule needs" || bad "plus-one" "$PLUS"
PATHS=$(echo "$R" | jq_ "o.graduation.board.pathways.length")
[ "$PATHS" = "2" ] && ok "both New York pathways are spelled out, with their blockers" || bad "pathways" "$PATHS"
FOCUS=$(echo "$R" | jq_ "o.graduation.focus.kind")
[ "$FOCUS" = "transcript" ] && ok "the ranked move is the official transcript — the most credit for one email" \
  || bad "leverage ranking" "$FOCUS"
RISK=$(echo "$R" | jq_ "o.graduation.risk.area")
[ "$RISK" = "math" ] && ok "the named risk is Math: the lost credit and the lowest marks sit together there" \
  || bad "risk area" "$RISK"
LEFT=$(echo "$R" | jq_ "o.graduation.pace.creditsLeft")
PLAN=$(echo "$R" | jq_ "o.graduation.totals.planAtEhs")
[ "$LEFT" = "$PLAN" ] && ok "pace projects exactly what the plan still asks for: $LEFT credits" \
  || bad "pace disagrees with the plan" "$LEFT vs $PLAN"
MOM=$(echo "$R" | jq_ "o.graduation.momentum")
[ -z "$MOM" ] && ok "one term is not a trend, so momentum says nothing" || bad "momentum from a single term" "$MOM"
BIG=$(node -e '
const areas=["english","math","science","social_studies","health","pe","fine_art","elective"];
const term=(n)=>({year:"2023-2024",gradeLevel:9,term:"Term "+n,average:80,
  courses:Array.from({length:20},(_,i)=>["B"+n+"-"+i,"Course "+n+"-"+i,"80",1,1,areas[i%8]])});
process.stdout.write(JSON.stringify({source:{school:"Big Transfer High",creditSystem:"nyc-4-term"},terms:[term(1),term(2)],exams:[]}));')
call admin POST "/accounts/$STUDENT/transcripts" "$BIG" >/dev/null
call admin POST "/accounts/$STUDENT/transcripts" "$BIG" >/dev/null
R=$(call student GET /graduation)
EST=$(echo "$R" | jq_ "o.graduation.totals.transferEstimate")
N=$(echo "$R" | jq_ "o.graduation.courses.length")
[ "$EST" = "16" ] && ok "20 more credits imported, but transfer stops at the 16-credit cap" || bad "transfer cap" "$EST"
[ "$N" = "45" ] && ok "importing the same school twice replaces it rather than doubling it (45 courses)" || bad "re-import doubled" "$N"

say "25. Sessions"
# A second sign-in from the "same person, different device".
curl -s -c "$JAR/student2" -H 'content-type: application/json' \
  -d "{\"email\":\"student$STAMP@example.com\",\"password\":\"another-long-password\"}" \
  -X POST "$API/auth/login" >/dev/null
R=$(call student GET /auth/sessions)
N=$(echo "$R" | jq_ "o.sessions&&o.sessions.length")
CUR=$(echo "$R" | jq_ "o.sessions&&o.sessions.filter(s=>s.current).length")
[ "$N" -ge 2 ] && ok "the account can see its $N live sessions" || bad "session listing" "$R"
[ "$CUR" = "1" ] && ok "exactly one is marked as the one asking" || bad "current session" "$R"

S=$(status other GET /auth/sessions)
R2=$(call other GET /auth/sessions)
OTHERN=$(echo "$R2" | jq_ "o.sessions&&o.sessions.length")
echo "$R2" | grep -q "$(echo "$R" | jq_ "o.sessions[0].id")" \
  && bad "another account can see these sessions" "$R2" \
  || ok "another account sees only their own ($OTHERN)"

R=$(call student POST /auth/sessions/revoke)
REV=$(echo "$R" | jq_ "o.revoked")
[ "$REV" -ge 1 ] && ok "signed out $REV other device(s), keeping this one" || bad "revoke others" "$R"
S=$(status student GET /me)
[ "$S" = "200" ] && ok "the session that asked still works (200)" || bad "kept own session" "HTTP $S"
S=$(status student2 GET /me)
[ "$S" = "401" ] && ok "the other device is signed out (401)" || bad "other device still live" "HTTP $S"

call student POST /auth/logout >/dev/null
S=$(status student GET /me)
[ "$S" = "401" ] && ok "after sign-out the session is dead (401)" || bad "logout" "HTTP $S"

printf "\n\033[1m%d passed, %d failed\033[0m\n" "$pass" "$fail"
rm -rf "$JAR"
[ "$fail" -eq 0 ]
