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
    intro: "This policy explains how JapLearn handles information used by the student app, public website, and teacher portal.",
    sections: [
      { title: "Information we use", items: ["Account information such as name, email address, role, and class membership.", "Learning information such as lesson completion, scores, attempts, mastery, feedback, and assigned activities.", "Basic technical information needed to operate, secure, and troubleshoot the service."] },
      { title: "Speaking activities", paragraphs: ["When a speaking activity is used, voice input may be sent securely to a speech-processing provider for transcription or pronunciation assessment. JapLearn may retain the resulting transcript, score, and learning feedback. Raw microphone recordings are not intended to be kept unless the feature clearly tells you otherwise."] },
      { title: "How information is used", items: ["Provide lessons, games, feedback, and synchronized progress.", "Allow teachers to manage their own classes and review their students’ learning records.", "Maintain account security, improve reliability, and respond to support requests."] },
      { title: "Sharing and protection", paragraphs: ["JapLearn does not sell personal information. Information is shared only with service providers needed to operate the platform or when required by law. Access controls are used to separate teacher classrooms and student records."] },
      { title: "Your choices", paragraphs: ["You may contact us to ask about your information, request a correction, or request account deletion. Some records may need to be retained when legally required or necessary to protect the service."] },
    ],
  },
  "/terms": {
    eyebrow: "USING JAPLEARN",
    title: "Terms of Use",
    intro: "These terms describe the basic rules for using JapLearn’s Android app, web experience, and teacher portal.",
    sections: [
      { title: "Accounts", items: ["Provide accurate account information and keep login details private.", "Teachers may access only classes and learners assigned to their own account.", "Do not share an account or attempt to access another person’s records."] },
      { title: "Acceptable use", items: ["Use JapLearn for lawful learning and classroom purposes.", "Do not disrupt the service, upload harmful material, bypass safeguards, or misuse other users’ information.", "Do not copy or redistribute JapLearn content and assets without permission."] },
      { title: "Learning results", paragraphs: ["Scores, speech assessments, generated feedback, and progress indicators are learning aids. They may not always be perfect and should not be treated as formal certification or professional advice."] },
      { title: "Availability and changes", paragraphs: ["Features may be improved, replaced, paused, or removed as JapLearn develops. Android and web are the currently supported release platforms; a native iOS app is not currently offered."] },
      { title: "Account action", paragraphs: ["JapLearn may restrict or remove access when an account threatens the service, violates these terms, or puts other users at risk."] },
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
        <small>Last updated September 10, 2026</small>
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
