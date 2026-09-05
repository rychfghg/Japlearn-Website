import { Search, TimerReset } from "lucide-react";
import { FormEvent, useState } from "react";
import { API_URL } from "../../../lib/api";

type Progress = { email:string; currentNodeId:string; answers:unknown[]; timeLeft:number; bestPercentage:number; completed:boolean; updatedAt:string };

export default function AdminResponseRushPage() {
  const [email,setEmail]=useState(""),[progress,setProgress]=useState<Progress|null>(null),[message,setMessage]=useState("");
  const lookup=async(event:FormEvent)=>{event.preventDefault();setMessage("Loading progress…");setProgress(null);try{const response=await fetch(`${API_URL}/api/response-rush/progress?email=${encodeURIComponent(email.trim())}`);if(response.status===204){setMessage("No Response Rush progress is recorded for this learner.");return;}if(!response.ok)throw new Error();setProgress(await response.json());setMessage("");}catch{setMessage("Response Rush progress could not be loaded.");}};
  return <section className="response-admin-page"><header><div className="response-page-icon rush"><TimerReset/></div><div><small>QUACKRESPONSE · SPEED MODE</small><h1>Response Rush</h1><p>Review a learner’s saved route, completion state, and best performance.</p></div></header><form className="response-lookup" onSubmit={lookup}><Search/><input type="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="Learner email address"/><button>Find progress</button></form>{message&&<p className="response-admin-message">{message}</p>}{progress&&<section className="response-summary-grid"><article><small>BEST SCORE</small><b>{progress.bestPercentage || 0}%</b></article><article><small>RESPONSES SAVED</small><b>{progress.answers?.length || 0}</b></article><article><small>TIME REMAINING</small><b>{progress.timeLeft || 0}s</b></article><article><small>STATUS</small><b>{progress.completed?'Completed':'In progress'}</b></article></section>}</section>;
}
