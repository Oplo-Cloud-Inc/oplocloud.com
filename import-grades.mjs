#!/usr/bin/env node
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index > -1 && args[index + 1] ? args[index + 1] : fallback;
};
const hasOption = (name) => args.includes(`--${name}`);

const api = option("api", process.env.OPLO_API || "http://127.0.0.1:8787/api/v1");
const adminEmail = process.env.OPLO_ADMIN_EMAIL;
const adminPassword = process.env.OPLO_ADMIN_PASSWORD;
const gradesFile = option("grades");
const studentEmailOverride = option("student");
const studentNameOverride = option("name");
const courseIdOverride = option("course-id");
const courseCodeOverride = option("course-code");
const courseTitleOverride = option("course");
const orgId = option("org", "org_oplo");
const createStudent = hasOption("create-student");

if (!adminEmail || !adminPassword || !gradesFile) {
  console.error(
    "Usage: OPLO_ADMIN_EMAIL=<email> OPLO_ADMIN_PASSWORD=<password> \\\n" +
    "  node api/scripts/import-grades.mjs --grades <grades.json> \\\n" +
    "  [--api <url>] [--student <email>] [--name <name>] [--course-id <id>] \\\n" +
    "  [--course-code <code>] [--course <title>] [--org <org_id>] [--create-student]"
  );
  process.exit(1);
}

const input = JSON.parse(readFileSync(gradesFile, "utf8"));
const studentEmail = (studentEmailOverride || input.studentEmail || "").trim();
const studentName = (studentNameOverride || input.studentName || "").trim();
const courseTitle = (courseTitleOverride || input.courseTitle || "").trim();
const items = Array.isArray(input.items) ? input.items : [];

if (!studentEmail || !courseTitle || !items.length) {
  console.error("Grades JSON must include studentEmail, courseTitle, and a non-empty items array.");
  process.exit(1);
}

let sessionCookie = "";
async function call(method, path, body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(sessionCookie ? { cookie: sessionCookie } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) sessionCookie = setCookie.split(";")[0];
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); }
    catch { payload = null; }
  }
  if (!response.ok) {
    const error = payload?.error || {};
    throw new Error(`${method} ${path} failed (${response.status}): ${error.message || text}`);
  }
  return payload;
}

function equalTitle(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function categoryFor(kind, course) {
  const grading = course.body?.grading;
  if (!Array.isArray(grading) || !grading.length) {
    throw new Error(`Course ${course.id} has no grading categories.`);
  }
  const needles = {
    quiz: ["quiz"],
    assignment: ["assign"],
    exam: ["exam", "midterm", "mid-term"]
  }[kind];
  const match = grading.find(([category]) =>
    needles.some((needle) => String(category || "").toLowerCase().includes(needle)));
  if (!match) throw new Error(`No grading category matches ${kind}.`);
  return match[0];
}

function validateItem(item, index) {
  const title = String(item.title || "").trim();
  const kind = String(item.kind || "").toLowerCase();
  const score = Number(item.score);
  const outOf = Number(item.outOf);
  if (!title) throw new Error(`Item ${index + 1} is missing a title.`);
  if (!["quiz", "assignment", "exam"].includes(kind)) {
    throw new Error(`Item "${title}" has invalid kind "${kind}".`);
  }
  if (!Number.isFinite(score) || score < 0) {
    throw new Error(`Item "${title}" has an invalid score.`);
  }
  if (!Number.isFinite(outOf) || outOf <= 0 || score > outOf) {
    throw new Error(`Item "${title}" must have 0 <= score <= outOf.`);
  }
  if (item.attemptsLeft !== undefined &&
      (!Number.isInteger(item.attemptsLeft) || item.attemptsLeft < 0)) {
    throw new Error(`Item "${title}" has an invalid attemptsLeft value.`);
  }
  if (item.attemptsTotal !== undefined &&
      (!Number.isInteger(item.attemptsTotal) || item.attemptsTotal <= 0 ||
       item.attemptsLeft > item.attemptsTotal)) {
    throw new Error(`Item "${title}" has an invalid attemptsTotal value.`);
  }
  return { ...item, title, kind, score, outOf };
}

console.log(`Signing in as ${adminEmail}...`);
const login = await call("POST", "/auth/login", {
  email: adminEmail,
  password: adminPassword
});
console.log(`Signed in as ${login.account.name}.`);

const { accounts } = await call("GET", `/accounts?orgId=${encodeURIComponent(orgId)}`);
let student = accounts.find((account) =>
  String(account.email || "").trim().toLowerCase() === studentEmail.toLowerCase());

if (!student && createStudent) {
  const password = process.env.OPLO_STUDENT_PASSWORD;
  if (!password || !studentName) {
    throw new Error("Creating a student requires studentName and OPLO_STUDENT_PASSWORD.");
  }
  const created = await call("POST", "/accounts", {
    email: studentEmail,
    name: studentName,
    password,
    role: "student",
    orgId
  });
  student = created.account;
  console.log(`Created student ${student.name}.`);
}
if (!student) {
  throw new Error(`No student account exists for ${studentEmail}.`);
}
console.log(`Student: ${student.name} (${student.id}).`);

let course = null;
if (courseIdOverride) {
  const response = await call("GET", `/courses/${encodeURIComponent(courseIdOverride)}`);
  course = response.course;
} else {
  const response = await call(
    "GET",
    `/courses?orgId=${encodeURIComponent(orgId)}&mine=false`
  );
  const matches = response.courses.filter((candidate) => {
    const titleMatches = !courseTitle || equalTitle(candidate.title, courseTitle);
    const codeMatches = !courseCodeOverride || candidate.code === courseCodeOverride;
    return titleMatches && codeMatches;
  });
  if (matches.length > 1) {
    throw new Error(
      `Found multiple matching courses: ${matches.map((c) => `${c.title} (${c.id})`).join(", ")}.`
    );
  }
  course = matches[0] || null;
}
if (!course) throw new Error(`No course found for ${courseTitle}.`);
console.log(`Course: ${course.title} (${course.id}).`);

const { members } = await call("GET", `/courses/${course.id}/members`);
if (!members.some((member) => member.id === student.id && member.role === "student")) {
  await call("POST", `/courses/${course.id}/members`, {
    accountId: student.id,
    role: "student"
  });
  console.log("Enrolled the student.");
} else {
  console.log("Student is already enrolled.");
}

const normalizedItems = items.map(validateItem);
const { assignments } = await call("GET", `/courses/${course.id}/assignments`);
const reconciled = [];
for (const item of normalizedItems) {
  const matches = assignments.filter((assignment) => equalTitle(assignment.title, item.title));
  if (matches.length > 1) {
    throw new Error(`Multiple assignments use the title "${item.title}".`);
  }
  let assignment = matches[0];
  if (!assignment) {
    const category = categoryFor(item.kind, course);
    const created = await call("POST", `/courses/${course.id}/assignments`, {
      title: item.title,
      category,
      outOf: item.outOf
    });
    assignment = created.assignment;
    reconciled.push(`created ${item.title}`);
  } else if (assignment.category !== categoryFor(item.kind, course) ||
             Number(assignment.outOf) !== item.outOf) {
    const updated = await call("PATCH", `/assignments/${assignment.id}`, {
      category: categoryFor(item.kind, course),
      outOf: item.outOf
    });
    assignment = updated.assignment;
    reconciled.push(`updated ${item.title}`);
  }
  item.assignmentId = assignment.id;
}
if (reconciled.length) console.log(`Assignments: ${reconciled.join(", ")}.`);

const gradeEntries = normalizedItems.map((item) => ({
  assignmentId: item.assignmentId,
  accountId: student.id,
  score: item.score,
  outOf: item.outOf
}));
const result = await call("POST", "/grades/batch", { grades: gradeEntries });
if (result.refused?.length) {
  throw new Error(`Grade import refused ${result.refused.length} entries: ${
    result.refused.map((entry) => `${entry.assignmentId}: ${entry.message}`).join("; ")
  }`);
}

const recorded = await call(
  "GET",
  `/grades?courseId=${encodeURIComponent(course.id)}&accountId=${encodeURIComponent(student.id)}`
);
const byAssignment = new Map(recorded.grades.map((grade) => [grade.assignmentId, grade]));
for (const item of normalizedItems) {
  const grade = byAssignment.get(item.assignmentId);
  if (!grade || Number(grade.score) !== item.score || Number(grade.outOf) !== item.outOf) {
    throw new Error(`Verification failed for ${item.title}.`);
  }
}

const summary = recorded.summaries.find((entry) => entry.courseId === course.id);
console.log(`Imported ${normalizedItems.length} grades for ${student.name}.`);
for (const item of normalizedItems) {
  console.log(`  ${item.title}: ${item.score}/${item.outOf}`);
}
if (summary) {
  console.log(
    `Course grade: ${summary.percent}% (${summary.letter}), computed over ${summary.countedWeight}% of the course.`
  );
}
const attempts = normalizedItems.filter((item) => item.attemptsTotal !== undefined);
if (attempts.length) {
  console.log(
    `Attempt metadata was supplied for ${attempts.length} items but is not represented by the gradebook schema.`
  );
}
await call("POST", "/auth/logout");
