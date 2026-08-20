import { CalendarDays, Check, ClipboardPlus } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { AssignableActivity, ClassRecord, Student } from "../types";

export default function AssignCommunicationPage() {
  const [activities, setActivities] = useState<AssignableActivity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [studentEmails, setStudentEmails] = useState<string[]>([]);
  const [classCode, setClassCode] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      teacherApi.getActivities(),
      teacherApi.getAllStudents(),
      teacherApi.getClasses(),
    ])
      .then(([activityData, studentData, classData]) => {
        setActivities(activityData);
        setStudents(studentData);
        setClasses(classData);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const submit = async () => {
    if (!activityIds.length || (!studentEmails.length && !classCode)) {
      setMessage("Choose an activity and at least one student or class.");
      return;
    }
    try {
      await teacherApi.assignActivities({
        activityIds,
        studentEmails,
        classCode,
        deadline,
        status: "ASSIGNED",
      });
      setMessage("Communication activities assigned successfully.");
      setActivityIds([]);
      setStudentEmails([]);
      setClassCode("");
      setDeadline("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assignment failed.");
    }
  };

  return (
    <section className="full-panel">
      <PageHeader
        eyebrow="ACTIVITY ASSIGNMENT"
        title="Assign communication practice"
        description="Select activities and assign them to a whole class or individual students."
      />
      {message && (
        <StatusMessage
          type={message.includes("successfully") ? "success" : "error"}
        >
          {message}
        </StatusMessage>
      )}
      <h3 className="form-section-title">1. Choose activities</h3>
      <div className="assignment-grid">
        {activities.map((activity) => {
          const selected = activityIds.includes(String(activity.id));
          return (
            <button
              key={activity.id}
              className={selected ? "selected" : ""}
              onClick={() =>
                setActivityIds((current) =>
                  selected
                    ? current.filter((id) => id !== String(activity.id))
                    : [...current, String(activity.id)],
                )
              }
            >
              <span>
                <ClipboardPlus />
              </span>
              <div>
                <b>{activity.title}</b>
                <small>
                  {activity.module ||
                    activity.activityType ||
                    "Communication practice"}
                </small>
              </div>
              {selected && <Check />}
            </button>
          );
        })}
      </div>
      <h3 className="form-section-title">2. Choose learners</h3>
      <div className="assignment-targets">
        <label>
          Assign to class
          <select
            value={classCode}
            onChange={(event) => {
              setClassCode(event.target.value);
              setStudentEmails([]);
            }}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.classCodes}>{item.classCodes}</option>
            ))}
          </select>
        </label>
        <div className="student-checks">
          {students.map((student) => (
            <label key={student.email}>
              <input
                type="checkbox"
                disabled={!!classCode}
                checked={studentEmails.includes(student.email)}
                onChange={() =>
                  setStudentEmails((current) =>
                    current.includes(student.email)
                      ? current.filter((email) => email !== student.email)
                      : [...current, student.email],
                  )
                }
              />
              <span>
                {student.fname} {student.lname}
                <small>{student.email}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="assignment-footer">
        <label>
          <CalendarDays />
          Deadline
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </label>
        <button className="primary" onClick={submit}>
          Assign activities
        </button>
      </div>
    </section>
  );
}
