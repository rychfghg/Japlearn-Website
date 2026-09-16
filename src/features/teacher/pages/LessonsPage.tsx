import { ArrowRight, BookOpen, FileSpreadsheet, Languages, MessageCircleMore, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusMessage from "../components/StatusMessage";
import { teacherApi } from "../services/teacherApi";
import type { ClassRecord, Lesson, Student, StudentLessonProgress } from "../types";
import { LESSON_STAGES, progressMapByEmail } from "../utils/mastery";
import { confirmAction } from "../../../lib/confirmAction";

const PATHS=[{key:"kana",icon:Languages,title:"Kana",eyebrow:"6 BUILT-IN SETS",text:"Hiragana and Katakana lessons with recognition practice.",stages:["hiragana","katakana"],tone:"purple"},{key:"words",icon:MessageCircleMore,title:"Words",eyebrow:"3 BUILT-IN LESSONS",text:"Everyday vocabulary collections with review exercises.",stages:["vocab"],tone:"green"},{key:"grammar",icon:BookOpen,title:"Grammar",eyebrow:"BUILT-IN PATH",text:"Sentence structure and foundational grammar practice.",stages:["sentence"],tone:"orange"}] as const;
const titleOf=(l:Lesson)=>l.lesson_title||l.lessonTitle||l.title||"Untitled lesson";
export default function LessonsPage(){
 const [params]=useSearchParams(); const [classes,setClasses]=useState<ClassRecord[]>([]); const [classCode,setClassCode]=useState(params.get("class")||"");
 const [lessons,setLessons]=useState<Lesson[]>([]); const [students,setStudents]=useState<Student[]>([]); const [progress,setProgress]=useState<StudentLessonProgress[]>([]); const [error,setError]=useState("");
 const load=()=>teacherApi.getTeacherLessons().then(setLessons).catch(e=>setError(e.message));
 useEffect(()=>{Promise.all([teacherApi.getClasses(),teacherApi.getAllStudents(),teacherApi.getAllLessonProgress()]).then(([c,s,p])=>{setClasses(c);setStudents(s);setProgress(p);if(!classCode&&c[0])setClassCode(c[0].classCodes)}).catch(e=>setError(e.message));load()},[]);
 const progressByEmail=useMemo(()=>progressMapByEmail(progress),[progress]);
 const stats=useMemo(()=>new Map(PATHS.map(path=>{const fields=LESSON_STAGES.filter(stage=>path.stages.includes(stage.key as never)).flatMap(stage=>stage.fields);const roster=students.filter(s=>!classCode||s.classCode===classCode);const value=!roster.length?0:Math.round(roster.reduce((sum,s)=>sum+(fields.filter(f=>progressByEmail.get(s.email)?.[f]).length/fields.length),0)/roster.length*100);return[path.key,value]})),[students,classCode,progressByEmail]);
 const shown=lessons.filter(l=>!classCode||l.classId===classCode);
 const remove=async(l:Lesson)=>{if(!await confirmAction(`Delete ${titleOf(l)}?`,{confirmLabel:"Delete lesson",description:"The lesson, its quiz, and saved quiz attempts will be removed."}))return;try{await teacherApi.deleteTeacherLesson(String(l.id));load()}catch(e){setError(e instanceof Error?e.message:"Could not delete lesson.")}};
 return <section className="lesson-page lesson-library">
  {error&&<StatusMessage>{error}</StatusMessage>}
  <div className="lesson-library-hero"><div><span className="eyebrow">LEARNING LIBRARY</span><h2>Lessons for every learning path</h2><p>Built-in JapLearn paths stay available automatically. Add your own visual lesson and optional quiz as a separate class milestone.</p></div><div className="lesson-hero-actions"><Link to="/teacher/lessons/progress" className="soft-button"><FileSpreadsheet/>Progress</Link><Link to={`/teacher/lessons/new?class=${encodeURIComponent(classCode)}`} className="primary-button"><Plus/>Create lesson</Link></div></div>
  <div className="lesson-library-toolbar"><label>Classroom<select value={classCode} onChange={e=>setClassCode(e.target.value)}>{classes.map(c=><option key={c.classCodes}>{c.classCodes}</option>)}</select></label><div><b>{shown.length}</b><small>Teacher lessons</small></div><div><b>{students.filter(s=>!classCode||s.classCode===classCode).length}</b><small>Learners</small></div></div>
  <div className="lesson-section-title"><div><Sparkles/><span><b>Automatic student lessons</b><small>JapLearn core curriculum</small></span></div><em>Always available</em></div>
  <div className="lesson-path-grid">{PATHS.map(path=>{const Icon=path.icon;const value=stats.get(path.key)||0;return <article className={`lesson-path-card ${path.tone}`} key={path.key}><span><Icon/></span><small>{path.eyebrow}</small><h3>{path.title}</h3><p>{path.text}</p><div><label>Class completion <b>{value}%</b></label><div className="mastery-bar-track small"><div className="mastery-bar-fill" style={{width:`${value}%`}}/></div></div></article>})}</div>
  <div className="lesson-section-title teacher"><div><BookOpen/><span><b>Added by you</b><small>Lessons that appear as new containers in the student app</small></span></div><Link to={`/teacher/lessons/new?class=${encodeURIComponent(classCode)}`}><Plus/>New lesson</Link></div>
  <div className="teacher-lesson-grid">{shown.map(lesson=><article key={lesson.id}><span className="teacher-lesson-type">{lesson.lesson_type||"LESSON"}</span><h3>{titleOf(lesson)}</h3><p>{lesson.lesson_description||lesson.description||"Teacher-created Japanese lesson"}</p><div className="teacher-lesson-meta"><span><BookOpen/>{lesson.sections?.length||0} sections</span><span><Sparkles/>{lesson.quiz?.length||0} quiz items</span></div><footer><Link to={`/teacher/lessons/${lesson.id}`}>Open lesson <ArrowRight/></Link><button onClick={()=>void remove(lesson)} aria-label={`Delete ${titleOf(lesson)}`}><Trash2/></button></footer></article>)}</div>
  {!shown.length&&<div className="lesson-library-empty"><BookOpen/><h3>No teacher lessons in this class</h3><p>Create a lesson from notes or a PDF, then add an optional quiz.</p><Link to={`/teacher/lessons/new?class=${encodeURIComponent(classCode)}`}><Plus/>Create the first lesson</Link></div>}
 </section>
}
