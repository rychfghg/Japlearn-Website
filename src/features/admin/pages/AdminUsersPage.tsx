import { useEffect, useMemo, useState } from "react";
import { Check, Edit3, MailCheck, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { API_URL } from "../../../lib/api";

type ManagedUser = { id: string; fname: string; lname: string; email: string; role: string; approved: boolean; emailConfirmed: boolean; password?: string };

export default function AdminUsersPage({ role }: { role: "student" | "teacher" }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/users?role=${role}`);
      if (!response.ok) throw new Error();
      setUsers(await response.json());
    } catch {
      setMessage(`Unable to load ${role} accounts. Confirm the updated Spring Boot backend is running at ${API_URL}.`);
    }
  };
  useEffect(() => { void load(); }, [role]);
  const visible = useMemo(() => users.filter((user) => `${user.fname} ${user.lname} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

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
    if (!window.confirm(`Permanently delete ${user.fname} ${user.lname}'s account?`)) return;
    const response = await fetch(`${API_URL}/api/users/${user.id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("The account could not be deleted."); return; }
    setMessage("Account deleted."); await load();
  };
  const create = () => setEditing({ id: "", fname: "", lname: "", email: "", role, approved: true, emailConfirmed: true, password: "" });
  const save = async (user: ManagedUser) => {
    if (!user.id && (!user.password || user.password.length < 6)) { setMessage("A temporary password of at least 6 characters is required."); return; }
    const response = await fetch(user.id ? `${API_URL}/api/users/${user.id}` : `${API_URL}/api/users/admin-create`, { method: user.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
    if (!response.ok) { setMessage("The account could not be saved. The email may already exist."); return; }
    setEditing(null); setMessage(user.id ? "Account updated successfully." : `${role} account created successfully.`); await load();
  };

  const title = role === "student" ? "Student management" : "Teacher management";
  return <div className="admin-users-page">
    <header><div><small>ACCOUNT DIRECTORY</small><h1>{title}</h1><p>Review contact details, confirmation status, approval, and account access.</p></div><div className="header-actions"><button className="soft-button" onClick={() => void load()}><RefreshCw size={16} />Refresh</button><button className="primary-button" onClick={create}><Plus size={16} />Add {role}</button></div></header>
    {message && <div className="admin-notice">{message}</div>}
    <div className="admin-user-toolbar"><Search /><input placeholder={`Search ${role}s by name or email`} value={query} onChange={(event) => setQuery(event.target.value)} /><span>{visible.length} records</span></div>
    <div className="admin-user-table"><div className="admin-user-row headings"><span>Account</span><span>Email</span><span>Verification</span><span>Access</span><span>Actions</span></div>
      {visible.map((user) => <div className="admin-user-row" key={user.id}>
        <span className="user-cell"><i>{user.fname?.[0]}{user.lname?.[0]}</i><b>{user.fname} {user.lname}</b></span><span>{user.email}</span>
        <span><em className={user.emailConfirmed ? "status approved" : "status waiting"}><MailCheck />{user.emailConfirmed ? "Confirmed" : "Unconfirmed"}</em></span>
        <span>{user.approved ? <em className="status approved"><Check />Approved</em> : <button className="approve-button" onClick={() => approve(user)} disabled={!user.emailConfirmed}>Approve</button>}</span>
        <span className="row-actions"><button onClick={() => setEditing(user)} aria-label="Edit"><Edit3 /></button><button className="danger" onClick={() => remove(user)} aria-label="Delete"><Trash2 /></button></span>
      </div>)}
      {!visible.length && <div className="empty-users">No matching {role} accounts.</div>}
    </div>
    {editing && <div className="admin-modal-backdrop"><form className="admin-edit-modal" onSubmit={(event) => { event.preventDefault(); void save(editing); }}><button type="button" className="modal-close" onClick={() => setEditing(null)}><X /></button><small>{editing.id ? "EDIT ACCOUNT" : "CREATE ACCOUNT"}</small><h2>{editing.id ? `${editing.fname} ${editing.lname}` : `New ${role}`}</h2><label>First name<input required value={editing.fname} onChange={(event) => setEditing({ ...editing, fname: event.target.value })} /></label><label>Last name<input required value={editing.lname} onChange={(event) => setEditing({ ...editing, lname: event.target.value })} /></label><label>Email<input required type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} /></label>{!editing.id && <label>Temporary password<input required type="password" value={editing.password} onChange={(event) => setEditing({ ...editing, password: event.target.value })} /></label>}<label className="check-field"><input type="checkbox" checked={editing.emailConfirmed} onChange={(event) => setEditing({ ...editing, emailConfirmed: event.target.checked })} />Email confirmed</label><label className="check-field"><input type="checkbox" checked={editing.approved} onChange={(event) => setEditing({ ...editing, approved: event.target.checked })} />Account approved</label><button className="primary-button" type="submit">{editing.id ? "Save account changes" : `Create ${role}`}</button></form></div>}
  </div>;
}
