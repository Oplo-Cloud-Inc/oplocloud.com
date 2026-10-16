/* Who a person is to a school, read from their roles. Not a permission: the
   guard still decides every action. This only answers the questions the
   inbox and the small records keep asking. */
import { isStaff, isLearnAdmin, guardsStudent } from "../core/guard.js";

export const orgOf = (actor) => (actor.orgs && actor.orgs[0] ? actor.orgs[0].org_id : null);
const has = (a, role) => (a.roles || []).some((r) => r.product === "learn" && r.role === role);
export const isTeacher = (a) => has(a, "teacher") || has(a, "author");
export const isOffice = (a, org) => isLearnAdmin(a, org) || has(a, "registrar") || has(a, "principal");
export const isSchoolStaff = (a, org) => isStaff(a, org) || isTeacher(a);
export const STAFF_ROLES_ALL = ["admin", "principal", "dean", "counselor", "registrar", "teacher", "author"];
export { guardsStudent };
