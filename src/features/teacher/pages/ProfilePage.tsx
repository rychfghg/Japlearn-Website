import { Mail, ShieldCheck, UserCircle } from "lucide-react";
import { session } from "../../../lib/auth";
import PageHeader from "../components/PageHeader";

export default function ProfilePage() {
  const user = session.get()!;

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="TEACHER ACCOUNT"
        title="Your profile"
        description="Account information synchronized from your existing JapLearn login."
      />
      <div className="teacher-profile-card">
        <div className="profile-cover">
          <span>先生</span>
        </div>
        <div className="profile-identity">
          <span>
            {user.fname?.[0]}
            {user.lname?.[0]}
          </span>
          <div>
            <h2>
              {user.fname} {user.lname}
            </h2>
            <p>Japanese language teacher</p>
          </div>
        </div>
        <div className="profile-details">
          <article>
            <Mail />
            <div>
              <small>EMAIL ADDRESS</small>
              <b>{user.email}</b>
            </div>
          </article>
          <article>
            <UserCircle />
            <div>
              <small>ACCOUNT ROLE</small>
              <b>{user.role}</b>
            </div>
          </article>
          <article>
            <ShieldCheck />
            <div>
              <small>ACCOUNT ID</small>
              <b>{user.userId || "Connected account"}</b>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
