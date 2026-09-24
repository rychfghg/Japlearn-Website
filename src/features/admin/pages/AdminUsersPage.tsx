import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, MailCheck, Mic2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { API_URL, portalFetch as fetch } from "../../../lib/api";

type ManagedUser = { id: string; fname: string; lname: string; email: string; role: string; approved: boolean; emailConfirmed: boolean; guidedPhraseEnabled: boolean; password?: string; classCode?: string };
type ClassOption = { classCode: string; classTitle: string; ownerTeacherEmail: string };
const mongoIdOrder = (id: string) => /^[0-9a-f]{24}$/i.test(id) ? id.toLowerCase() : null;

export default function AdminUsersPage({ role }: { role: "student" | "teacher" }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [guidedFilter, setGuidedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [message, setMessage] = useState("");
  const [accessUpdating, setAccessUpdating] = useState<string[]>([]);
  // Student class assignments live on the student record, loaded separately.
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const isStudent = role === "student";

  const load = async () => {
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/users?role=${role}`);
      if (!response.ok) throw new Error();
      setUsers(await response.json());
      if (role === "student") void loadClasses();
    } catch {
      setMessage(`Unable to load ${role} accounts. Confirm the updated Spring Boot backend is running at ${API_URL}.`);
    }
  };
  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/student-classes`);
      if (!response.ok) throw new Error();
      const body = await response.json();
      setClassOptions(Array.isArray(body?.classes) ? body.classes : []);
      setAssignments(body?.assignments && typeof body.assignments === "object" ? body.assignments : {});
    } catch {
      setClassOptions([]);
      setAssignments({});
    }
  };
  const classOf = (user: ManagedUser) => assignments[user.email?.trim().toLowerCase()] || user.classCode || "";
  const classLabel = (code: string) => {
    const match = classOptions.find((option) => option.classCode === code);
    return match?.classTitle ? `${match.classTitle}` : "";
  };
  // Saves the class code on the student record; blank removes them from their class.
  const saveClass = async (userId: string, classCode: string) => {
    const response = await fetch(`${API_URL}/api/admin/student-classes/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classCode }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "The class could not be saved.");
    }
  };
  useEffect(() => { void load(); }, [role]);
  const availableClasses = useMemo(() => [...new Set([
    ...classOptions.map((option) => option.classCode),
    ...Object.values(assignments),
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b)), [classOptions, assignments]);
  const visible = useMemo(() => users.filter((user) => {
    const code = assignments[user.email?.trim().toLowerCase()] || user.classCode || "";
    const matchesSearch = `${user.fname} ${user.lname} ${user.email} ${code}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesApproval = approvalFilter === "all" || (approvalFilter === "approved" ? user.approved : !user.approved);
    const matchesClass = classFilter === "all" || (classFilter === "with-class" ? !!code : classFilter === "no-class" ? !code : code === classFilter);
    const matchesGuided = guidedFilter === "all" || (guidedFilter === "allowed" ? user.guidedPhraseEnabled : !user.guidedPhraseEnabled);
    return matchesSearch && (!isStudent || (matchesApproval && matchesClass && matchesGuided));
  }).sort((a, b) => {
    if (!isStudent) return 0;
    if (sortBy === "newest" || sortBy === "oldest") {
      const aId = mongoIdOrder(a.id);
      const bId = mongoIdOrder(b.id);
      if (aId && bId) return sortBy === "newest" ? bId.localeCompare(aId) : aId.localeCompare(bId);
      return 0;
    }
    if (sortBy === "name-desc") return `${b.fname} ${b.lname}`.localeCompare(`${a.fname} ${a.lname}`);
    if (sortBy === "class") return (assignments[a.email?.trim().toLowerCase()] || a.classCode || "").localeCompare(assignments[b.email?.trim().toLowerCase()] || b.classCode || "") || `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
    return `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
  }), [users, query, assignments, approvalFilter, classFilter, guidedFilter, sortBy, isStudent]);

  const update = async (user: ManagedUser, changes: Partial<ManagedUser>) => {
    const response = await fetch(`${API_URL}/api/users/${user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    if (!response.ok) { setMessage("The account could not be updated."); return; }
    setEditing(null); setMessage("Account updated successfully."); await load();
  };
  const approve = async (user: ManagedUser) => {
    const response = await fetch(`${API_URL}/api/users/approve/${user.id}`, { method: "POST" });
    if (!response.ok) { setMessage("Approval failed."); return; }
    setMessage(`${user.fname}'s account is now approved.`); await load();
  };
  const remove = async (user: ManagedUser) => {
    if (!await confirmAction(`Permanently delete ${user.fname} ${user.lname}'s account?`, { confirmLabel: "Delete account", description: "The user will lose access to this account. This action cannot be undone here." })) return;
    const response = await fetch(`${API_URL}/api/users/${user.id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("The account could not be deleted."); return; }
    setMessage("Account deleted."); await load();
  };
  const toggleGuidedAccess = async (user: ManagedUser) => {
    if (accessUpdating.includes(user.id)) return;
    const enabled = !user.guidedPhraseEnabled;
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, guidedPhraseEnabled: enabled } : item));
    setAccessUpdating((current) => [...current, user.id]);
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/guided-phrase-access`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      if (!response.ok) throw new Error(await response.text());
      setMessage(`Guided Phrase Practice ${enabled ? "allowed" : "blocked"} for ${user.fname}.`);
    } catch {
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, guidedPhraseEnabled: user.guidedPhraseEnabled } : item));
      setMessage("Guided Phrase access could not be changed. Deploy the updated backend, then try again.");
    } finally {
      setAccessUpdating((current) => current.filter((id) => id !== user.id));
    }
  };
  const setGuidedAccessForAll = async (enabled: boolean) => {
    if (!await confirmAction(`${enabled ? "Allow" : "Block"} Guided Phrase Practice for all student accounts?`, { confirmLabel: enabled ? "Allow access" : "Block access" })) return;
    setMessage("Updating Guided Phrase access…");
    const results = await Promise.all(users.map((user) => fetch(`${API_URL}/api/users/${user.id}/guided-phrase-access`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) })));
    setMessage(results.some((response) => !response.ok) ? "Some student accounts could not be updated. Please try again." : `Guided Phrase Practice is now ${enabled ? "allowed" : "blocked"} for all students.`);
    await load();
  };
  const create = () => setEditing({ id: "", fname: "", lname: "", email: "", role, approved: true, emailConfirmed: true, guidedPhraseEnabled: false, password: "", classCode: "" });
  const save = async (user: ManagedUser) => {
    if (!user.id && (!user.password || user.password.length < 6)) { setMessage("A temporary password of at least 6 characters is required."); return; }
    const { classCode = "", ...account } = user;
    const response = await fetch(user.id ? `${API_URL}/api/users/${user.id}` : `${API_URL}/api/users/admin-create`, { method: user.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account) });
    if (!response.ok) { setMessage("The account could not be saved. The email may already exist."); return; }
    let classNote = "";
    if (isStudent) {
      const saved = await response.json().catch(() => null);
      const studentId = user.id || saved?.id;
      const previous = user.id ? classOf(user) : "";
      if (studentId && classCode.trim() !== previous) {
        try { await saveClass(studentId, classCode.trim()); }
        catch (error) { classNote = ` The class was not changed: ${error instanceof Error ? error.message : "please try again"}.`; }
      }
    }
    setEditing(null); setMessage((user.id ? "Account updated successfully." : `${role} account created successfully.`) + classNote); await load();
  };

  const title = role === "student" ? "Student management" : "Teacher management";
  return <div className="admin-users-page">
    <header><div><small>ACCOUNT DIRECTORY</small><h1>{title}</h1><p>Review contact details, confirmation status, approval, and account access.</p></div><div className="header-actions"><button className="soft-button" onClick={() => void load()}><RefreshCw size={16} />Refresh</button><button className="primary-button" onClick={create}><Plus size={16} />Add {role}</button></div></header>
    {message && <div className="admin-notice">{message}</div>}
    <div className="admin-user-toolbar"><Search /><input placeholder={`Search ${role}s by name or email`} value={query} onChange={(event) => setQuery(event.target.value)} /><span>{visible.length} records</span>{role === "student" && <><button className="bulk-guided allow" onClick={() => void setGuidedAccessForAll(true)}>Allow all</button><button className="bulk-guided block" onClick={() => void setGuidedAccessForAll(false)}>Block all</button></>}</div>
    {isStudent && <div className="admin-student-filters" aria-label="Student list filters">
      <label>Approval<select value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)}><option value="all">All students</option><option value="approved">Approved</option><option value="pending">Not approved</option></select></label>
      <label>Class<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option><option value="with-class">With a class</option><option value="no-class">No class</option>{availableClasses.map((code) => <option key={code} value={code}>{classLabel(code) ? `${classLabel(code)} · ${code}` : code}</option>)}</select></label>
      <label>Guided Phrase<select value={guidedFilter} onChange={(event) => setGuidedFilter(event.target.value)}><option value="all">Allowed and blocked</option><option value="allowed">Allowed</option><option value="blocked">Blocked</option></select></label>
      <label>Sort by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Newest added</option><option value="oldest">First added</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="class">Class code</option></select></label>
      <button type="button" className="admin-filter-clear" onClick={() => { setQuery(""); setApprovalFilter("all"); setClassFilter("all"); setGuidedFilter("all"); setSortBy("newest"); }}>Clear filters</button>
    </div>}
    <div className={`admin-user-table ${role === "student" ? "has-guided-access has-class" : ""}`}><div className="admin-user-row headings"><span>Account</span><span>Email</span>{isStudent && <span>Class</span>}<span>Verification</span><span>Access</span>{role === "student" && <span>Guided Phrase</span>}<span>Actions</span></div>
      {visible.map((user) => <div className="admin-user-row" key={user.id}>
        <span className="user-cell"><i>{user.fname?.[0]}{user.lname?.[0]}</i><b>{user.fname} {user.lname}</b></span><span>{user.email}</span>
        {isStudent && <span className="class-cell">{classOf(user) ? <><em className="class-chip" title={classOf(user)}>{classOf(user)}</em>{classLabel(classOf(user)) && <small>{classLabel(classOf(user))}</small>}</> : <em className="class-chip none">No class</em>}</span>}
        <span><em className={user.emailConfirmed ? "status approved" : "status waiting"}><MailCheck />{user.emailConfirmed ? "Confirmed" : "Unconfirmed"}</em></span>
        <span>{user.approved ? <em className="status approved"><Check />Approved</em> : <button className="approve-button" onClick={() => approve(user)} disabled={!user.emailConfirmed}>Approve</button>}</span>
        {role === "student" && <span className="guided-access-cell"><button type="button" disabled={accessUpdating.includes(user.id)} className={`guided-access-toggle ${user.guidedPhraseEnabled ? "on" : "off"}`} role="switch" aria-checked={user.guidedPhraseEnabled} aria-label={`${user.guidedPhraseEnabled ? "Disable" : "Allow"} Guided Phrase for ${user.fname}`} onClick={() => void toggleGuidedAccess(user)}><i><b /></i><span><Mic2 />{accessUpdating.includes(user.id) ? "Saving…" : user.guidedPhraseEnabled ? "Allowed" : "Blocked"}</span></button></span>}
        <span className="row-actions"><button onClick={() => setEditing({ ...user, classCode: classOf(user) })} aria-label="Edit"><Edit3 /></button><button className="danger" onClick={() => remove(user)} aria-label="Delete"><Trash2 /></button></span>
      </div>)}
      {!visible.length && <div className="empty-users">No matching {role} accounts.</div>}
    </div>
    {editing && <div className="admin-modal-backdrop"><form className="admin-edit-modal" onSubmit={(event) => { event.preventDefault(); void save(editing); }}><button type="button" className="modal-close" onClick={() => setEditing(null)}><X /></button><small>{editing.id ? "EDIT ACCOUNT" : "CREATE ACCOUNT"}</small><h2>{editing.id ? `${editing.fname} ${editing.lname}` : `New ${role}`}</h2><label>First name<input required value={editing.fname} onChange={(event) => setEditing({ ...editing, fname: event.target.value })} /></label><label>Last name<input required value={editing.lname} onChange={(event) => setEditing({ ...editing, lname: event.target.value })} /></label><label>Email<input required type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} /></label>{!editing.id && <label>Temporary password<input required type="password" value={editing.password} onChange={(event) => setEditing({ ...editing, password: event.target.value })} /></label>}{isStudent && <label>Class code<select className="admin-class-select" value={editing.classCode || ""} onChange={(event) => setEditing({ ...editing, classCode: event.target.value })}><option value="">No class</option>{classOptions.map((option) => <option key={option.classCode} value={option.classCode}>{option.classCode}{option.classTitle ? ` · ${option.classTitle}` : ""}</option>)}{editing.classCode && !classOptions.some((option) => option.classCode === editing.classCode) && <option value={editing.classCode}>{editing.classCode}</option>}</select><em className="admin-class-hint">{classOptions.length ? "The student appears in that teacher's class right away." : "No classes exist yet. A teacher creates them in the teacher portal."}</em></label>}<label className="check-field"><input type="checkbox" checked={editing.emailConfirmed} onChange={(event) => setEditing({ ...editing, emailConfirmed: event.target.checked })} />Email confirmed</label><label className="check-field"><input type="checkbox" checked={editing.approved} onChange={(event) => setEditing({ ...editing, approved: event.target.checked })} />Account approved</label><button className="primary-button" type="submit">{editing.id ? "Save account changes" : `Create ${role}`}</button></form></div>}
  </div>;
}
import { confirmAction } from "../../../lib/confirmAction";
