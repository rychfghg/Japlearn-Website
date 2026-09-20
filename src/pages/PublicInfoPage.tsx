import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Brand from "../components/Brand";

type PageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { title: string; paragraphs?: string[]; items?: string[] }[];
};

const CONTACT_EMAIL = "japlearnofficial@gmail.com";

const pages: Record<string, PageContent> = {
  "/privacy": {
    eyebrow: "PRIVACY & TRUST",
    title: "Privacy Policy",
    intro: "This policy explains exactly what the JapLearn Android app, website and teacher portal collect, why, who processes it, and how to delete it.",
    sections: [
      { title: "Information we collect", items: [
        "Account details you provide: first and last name, email address, password (stored encrypted with bcrypt, never in readable form), your role (student or teacher), and the class code you join.",
        "Learning records created as you use JapLearn: lesson completion, quiz answers, game scores and attempts, badges, streaks, daily goal minutes, and speaking practice results.",
        "Basic technical information needed to operate and troubleshoot the service, such as app version and the date and time of activity.",
        "Teacher accounts also hold the classes, lessons and activities they create.",
      ] },
      { title: "Microphone and voice recordings", paragraphs: [
        "Speaking activities (Talk with Sumi, Guided Phrase Practice, Dialogue Relay and similar exercises) record the learner's voice only while that activity is running, and only after microphone permission is granted on the device.",
        "Recorded speech is sent securely to Microsoft Azure Speech Services to measure pronunciation, accuracy, fluency and completeness. The spoken text is also sent to Google Gemini to generate learning feedback. JapLearn stores the resulting transcript, scores and feedback with the learner's account. Raw audio is not retained after assessment, and voice data is never used for advertising or identification.",
        "Microphone access can be declined; every other part of JapLearn continues to work.",
      ] },
      { title: "Device permissions the Android app requests", items: [
        "Microphone (RECORD_AUDIO) — speaking and pronunciation activities.",
        "Internet — signing in, saving progress, and loading lessons.",
        "Vibration — short haptic feedback in some games.",
        "Modify audio settings — routing lesson and game audio correctly.",
        "Photos and files — only when a user attaches an image or document to lesson content.",
        "JapLearn does not request location, contacts, camera, calendar, SMS or phone identity.",
      ] },
      { title: "How information is used", items: [
        "Create and manage accounts, save and sync learning progress, unlock lessons and award badges.",
        "Run classroom features so teachers can assign activities and review their own learners' records.",
        "Provide automated speaking feedback and scores.",
        "Answer support requests, and keep the service secure and reliable.",
        "JapLearn does not use personal information for advertising and does not sell it.",
      ] },
      { title: "What teachers can see", paragraphs: [
        "A teacher can see the name, email address and learning records — lesson progress, quiz and game scores, and speaking feedback — of learners who joined their class with that teacher's class code. Teachers cannot see passwords, and learners cannot see one another's records.",
      ] },
      { title: "Service providers that process data", items: [
        "MongoDB Atlas — stores account and learning records.",
        "Render — hosts the JapLearn server.",
        "Microsoft Azure Speech Services — pronunciation assessment.",
        "Google Gemini — conversation and learning feedback.",
        "Brevo — sends account emails (confirmation, password reset, account deletion).",
        "Expo — delivers app updates.",
        "These providers process data only to deliver JapLearn. Personal information is never sold or shared for advertising.",
      ] },
      { title: "Security", paragraphs: [
        "Connections use encrypted HTTPS. Passwords are hashed with bcrypt and cannot be read by JapLearn staff. Sign-in sessions expire, sensitive endpoints are rate limited, and teacher access is restricted to that teacher's own classes. No online service can guarantee perfect security, so keep passwords private and report anything suspicious.",
      ] },
      { title: "Storage, location and retention", paragraphs: [
        "Data is stored on servers operated by the providers listed above and may be processed outside the Philippines. Account and learning information is kept while the account is active. After deletion, records are removed immediately, although routine encrypted backups may hold copies for a short period before they expire.",
      ] },
      { title: "Deleting your account", paragraphs: [
        "Learners can delete their account in the app under Profile, then Delete account, or from any browser at portal.japlearn.com/delete-account without installing the app. Deletion permanently removes the account, lesson progress, badges, quiz and game scores, and speaking feedback, and cannot be undone.",
        "Teacher accounts are reviewed by a person first, because deleting one also affects the classes and learner records attached to it. Anyone who can no longer access their email address can write to japlearnofficial@gmail.com and the team will verify and delete the account on their behalf, normally within 30 days.",
      ] },
      { title: "Your choices and rights", paragraphs: [
        "You can review your profile, join or change a class, reset your password, decline microphone access, and request a copy or correction of your information by email. Some details, such as the account email address, are required for the service to function.",
      ] },
      { title: "Children and school use", paragraphs: [
        "JapLearn is built for classroom use and is intended for learners aged 13 and above, or younger learners enrolled by their school with the consent of a parent, guardian or the school. If a child created an account without the proper consent, contact japlearnofficial@gmail.com and it will be deleted.",
      ] },
      { title: "Changes and contact", paragraphs: [
        "This policy is updated when JapLearn features or privacy practices change, and the current version with its effective date is always available here and inside the app. For any privacy question or request, email japlearnofficial@gmail.com.",
      ] },
    ],
  },
  "/terms": {
    eyebrow: "USING JAPLEARN",
    title: "Terms of Use",
    intro: "These terms cover the JapLearn Android app, the website and the teacher portal.",
    sections: [
      { title: "Who can use JapLearn", paragraphs: [
        "JapLearn is built for classroom language learning and is intended for learners aged 13 and above, or younger learners enrolled by their school with the consent of a parent, guardian or the school. JapLearn is free to use: there are no paid features, subscriptions or in-app purchases.",
      ] },
      { title: "Accounts", items: [
        "Provide accurate account information and keep sign-in details private.",
        "Student accounts are activated after email confirmation and teacher approval.",
        "Teachers may access only the classes and learners assigned to their own account.",
        "Do not share an account or attempt to access another person's records.",
      ] },
      { title: "Classes and learner records", paragraphs: [
        "Joining a class with a class code lets that teacher see the learner's name, email address and learning records for the class, including lesson progress, quiz and game scores, and speaking feedback. Join only classes you belong to.",
      ] },
      { title: "Speaking activities", paragraphs: [
        "Speaking activities record the learner's voice while the activity is running and send it for automated pronunciation assessment and feedback, as described in the Privacy Policy. Use them for language practice only. Do not record other people or share private or sensitive information through them.",
      ] },
      { title: "Acceptable use", items: [
        "Use JapLearn for lawful learning and classroom purposes.",
        "Do not disrupt the service, upload harmful material, bypass safeguards, cheat in graded activities, impersonate another person, or misuse other users' information.",
        "Do not copy or redistribute JapLearn content and assets without permission.",
      ] },
      { title: "Automated scores and feedback", paragraphs: [
        "Scores, pronunciation assessments and generated feedback are produced automatically and are learning aids. They may be inaccurate or incomplete, are not a formal language certification, and are not professional or academic advice. Teachers decide how results count in class.",
      ] },
      { title: "Availability and changes", paragraphs: [
        "Features may be improved, replaced, paused or removed as JapLearn develops, and progress saved offline syncs when a device reconnects. Uninterrupted access cannot be guaranteed. Android and the web are the supported platforms; a native iOS app is not currently offered.",
      ] },
      { title: "Content ownership", paragraphs: [
        "Lessons, activities, characters, artwork and other JapLearn material belong to JapLearn or its licensors. Content a user submits remains theirs, and they grant JapLearn permission to process it in order to run the service and show it to their teacher.",
      ] },
      { title: "Ending an account", paragraphs: [
        "Accounts can be deleted at any time in the app under Profile, then Delete account, or at portal.japlearn.com/delete-account. Deletion is permanent. JapLearn may restrict or remove access when an account threatens the service, violates these terms, or puts other users at risk.",
      ] },
      { title: "Changes and contact", paragraphs: [
        "These terms may be updated as JapLearn improves, and the current version is available here and inside the app. Continued use after an update means the revised terms apply. Questions: japlearnofficial@gmail.com.",
      ] },
    ],
  },
  "/accessibility": {
    eyebrow: "LEARNING FOR MORE PEOPLE",
    title: "Accessibility",
    intro: "JapLearn aims to make Japanese learning understandable, navigable, and comfortable across supported Android devices and modern web browsers.",
    sections: [
      { title: "Our approach", items: ["Clear headings, readable contrast, and consistent navigation.", "Keyboard-friendly controls on the website where supported.", "Text alternatives for meaningful images and labels for interactive controls.", "Responsive layouts for desktop, Android browsers, and iPhone or iPad browsers."] },
      { title: "Audio and speaking features", paragraphs: ["Some activities depend on hearing or microphone access. Supporting text, romaji, translations, or hints are provided where the learning experience supports them. Browser and device permissions may affect these features."] },
      { title: "Report an accessibility problem", paragraphs: ["If something prevents you from using JapLearn, tell us which page or activity you were using, your device and browser, and what happened. We will use that information to investigate improvements."] },
    ],
  },
  "/contact": {
    eyebrow: "HELP & CONTACT",
    title: "How can we help?",
    intro: "Contact the JapLearn team for account questions, technical problems, privacy requests, classroom support, or general feedback.",
    sections: [
      { title: "Before sending a message", items: ["Include the email address connected to your account, but never send your password.", "Tell us whether you are using Android, desktop web, or mobile web.", "Include the page, game, or classroom feature involved and a short description of what happened.", "For a visual problem, attach a screenshot with private student information hidden."] },
      { title: "Response and safety", paragraphs: ["Support requests are reviewed as availability allows. JapLearn will never ask you to send your password, database credentials, or private API keys by email."] },
    ],
  },
};

export default function PublicInfoPage() {
  const { pathname } = useLocation();
  const page = pages[pathname] ?? pages["/contact"];

  return (
    <main className="public-info-page">
      <nav className="public-info-nav">
        <Brand />
        <Link to="/"><ArrowLeft /> Back to JapLearn</Link>
      </nav>
      <header className="public-info-hero">
        <span>{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <small>Last updated September 20, 2026</small>
      </header>
      <div className="public-info-layout">
        <article className="public-info-content">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
        </article>
        <aside className="public-info-contact">
          <Mail />
          <span>CONTACT JAPLEARN</span>
          <h2>Still need help?</h2>
          <p>Send your question to our support email.</p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}<ExternalLink /></a>
        </aside>
      </div>
      <footer className="public-info-footer">© 2026 JapLearn · Japanese made interactive.</footer>
    </main>
  );
}
