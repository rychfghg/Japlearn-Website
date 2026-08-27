import {
  ArrowRight,
  Apple,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  Gamepad2,
  GraduationCap,
  MessageCircleMore,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import hello from "../assets/hello.png";
import idle from "../assets/idle.png";
import appHome from "../assets/app-home.png";
import appLearn from "../assets/app-learn.png";
import appTalk from "../assets/app-talk.png";
import appExercises from "../assets/app-exercises.png";
import Brand from "../components/Brand";

const learningFeatures = [
  {
    Icon: BookOpen,
    title: "Guided Japanese lessons",
    text: "Build confidence in kana, vocabulary, grammar, and everyday expressions through a clear learning path.",
  },
  {
    Icon: Gamepad2,
    title: "Practice that feels like play",
    text: "Interactive exercises turn repetition into short, rewarding challenges students want to complete.",
  },
  {
    Icon: MessageCircleMore,
    title: "Real communication practice",
    text: "Learners practice speaking, responding, and choosing natural expressions for real situations.",
  },
  {
    Icon: BarChart3,
    title: "Progress you can understand",
    text: "Students see their growth while teachers identify strengths, gaps, and the right next step.",
  },
];

const teacherBenefits = [
  "Organize students by class",
  "Create and manage lessons",
  "Assign communication activities",
  "Monitor performance and generate reports",
];

const appScreens = [
  {
    id: "home",
    label: "Home",
    eyebrow: "YOUR DAILY JOURNEY",
    title: "A welcoming path that keeps learners moving.",
    text: "Daily goals, classes, learning paths, streaks, and the JapLearn mascot come together in one friendly home experience.",
    image: appHome,
    Icon: GraduationCap,
  },
  {
    id: "learn",
    label: "Learn",
    eyebrow: "STRUCTURED PROGRESSION",
    title: "Lessons feel like an adventure, not a checklist.",
    text: "The connected lesson map makes the next step clear and gives each completed milestone a meaningful sense of progress.",
    image: appLearn,
    Icon: BookOpen,
  },
  {
    id: "talk",
    label: "Talk",
    eyebrow: "AI SPEAKING PRACTICE",
    title: "Practice real responses with Sumi.",
    text: "A focused speaking room helps learners listen, respond in Japanese, and review communication feedback in a guided setting.",
    image: appTalk,
    Icon: MessageCircleMore,
  },
  {
    id: "exercises",
    label: "Exercises",
    eyebrow: "GAMIFIED PRACTICE",
    title: "Turn useful Japanese into playable challenges.",
    text: "Kana, vocabulary, grammar, response, and situational games reinforce classroom learning through short interactive challenges.",
    image: appExercises,
    Icon: Gamepad2,
  },
];

export default function Landing() {
  const androidDownloadUrl =
    "https://expo.dev/accounts/reybacolod/projects/japlearn/builds/6c08d2de-f5aa-4694-860e-d26e661f0f36";
  const [activeScreen, setActiveScreen] = useState(appScreens[0]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      const available =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? (window.scrollY / available) * 100 : 0);
      setNavScrolled(window.scrollY > 24);
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 },
    );

    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => {
        revealObserver.observe(element);
      });

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <main className="landing">
      <div className={`landing-nav-shell ${navScrolled ? "scrolled" : ""}`}>
        <nav className="landing-nav" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <a href="#about">Why JapLearn</a>
            <a href="#experience">App experience</a>
            <a href="#students">Students</a>
            <a href="#teachers">Teachers</a>
            <a className="nav-download" href={androidDownloadUrl}>
              <Download size={16} /> Download app
            </a>
            <Link className="nav-cta" to="/teacher/login">
              Teacher sign in <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
        <span
          className="scroll-progress"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <section className="landing-hero" data-reveal>
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Learn Japanese. Practice naturally. Grow
            confidently.
          </span>
          <h1>
            Japanese learning
            <br />
            <em>made interactive.</em>
          </h1>
          <p>
            JapLearn brings lessons, games, speaking practice, and classroom
            progress into one connected experience—helping students enjoy
            learning and helping teachers guide every learner with confidence.
          </p>
          <div className="hero-actions">
            <a className="primary apk-download" href={androidDownloadUrl}>
              <Download size={18} /> Download the app
            </a>
            <Link className="secondary" to="/teacher/login">
              Teacher portal
            </Link>
          </div>
          <div className="app-availability" aria-label="JapLearn app availability">
            <a className="direct-app-download" href={androidDownloadUrl}>
              <span className="availability-icon">
                <Download size={20} />
              </span>
              <span>
                <small>Available now</small>
                <strong>Android download</strong>
              </span>
            </a>
            <div className="store-coming-soon" aria-disabled="true">
              <span className="availability-icon">
                <Play size={19} />
              </span>
              <span>
                <small>Coming soon</small>
                <strong>Google Play</strong>
              </span>
            </div>
            <div className="store-coming-soon" aria-disabled="true">
              <span className="availability-icon">
                <Apple size={20} />
              </span>
              <span>
                <small>Coming soon</small>
                <strong>App Store</strong>
              </span>
            </div>
          </div>
          <div className="trust-row">
            <span>
              <ShieldCheck /> Safe classroom access
            </span>
            <span>
              <Users /> Student-centered
            </span>
            <span>
              <Gamepad2 /> Built for active learning
            </span>
          </div>
          <div className="hero-proof">
            <article>
              <b>4</b>
              <span>connected learning modes</span>
            </article>
            <article>
              <b>1</b>
              <span>clear classroom journey</span>
            </article>
            <article>
              <b>∞</b>
              <span>ways to keep practicing</span>
            </article>
          </div>
        </div>

        <div
          className="hero-art"
          aria-label="JapLearn mascot in a Japanese-inspired scene"
        >
          <div className="sun" />
          <div className="fuji" />
          <div className="torii">
            <i />
            <i />
          </div>
          <div className="speech">
            一緒に日本語を学ぼう！
            <small>Let’s learn Japanese together!</small>
          </div>
          <div
            className="animated-mascot"
            aria-label="Ahiru, the JapLearn mascot, waving"
          >
            <img className="mascot-idle" src={idle} alt="" />
            <img className="mascot-wave" src={hello} alt="" />
          </div>
          <div className="float-card fc-one">
            <BookOpen />
            <span>
              <b>Learn step by step</b>
              <small>Lessons made approachable</small>
            </span>
          </div>
          <div className="float-card fc-two">
            <Gamepad2 />
            <span>
              <b>Practice through play</b>
              <small>Skills that grow naturally</small>
            </span>
          </div>
        </div>
      </section>

      <section id="about" className="about-japlearn" data-reveal>
        <div className="about-intro">
          <span className="section-kicker">WHAT IS JAPLEARN?</span>
          <h2>
            More than a lesson app—it is a complete Japanese learning journey.
          </h2>
          <p>
            JapLearn combines structured teaching with interactive practice.
            Every lesson connects to meaningful activities, communication
            challenges, and progress insights, so classroom learning continues
            beyond memorization.
          </p>
        </div>
        <div className="feature-grid">
          {learningFeatures.map(({ Icon, title, text }) => (
            <article key={title}>
              <span>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="experience"
        className={`app-showcase screen-${activeScreen.id}`}
        aria-labelledby="inside-japlearn-title"
      >
        <div className="showcase-heading">
          <span className="section-kicker purple-kicker">
            SEE JAPLEARN IN ACTION
          </span>
          <h2 id="inside-japlearn-title">
            One connected experience from learning to speaking.
          </h2>
          <p>
            Explore the actual JapLearn student experience. Select an area to
            see how each part supports a different stage of learning.
          </p>
        </div>

        <div className="showcase-layout">
          <div className="phone-stage">
            <div className="phone-glow" />
            <div className="phone-frame">
              <span className="phone-speaker" />
              <img
                src={activeScreen.image}
                alt={`${activeScreen.label} screen in the JapLearn app`}
              />
            </div>
          </div>

          <div className="showcase-content">
            <div
              className="screen-tabs"
              role="tablist"
              aria-label="JapLearn app screens"
            >
              {appScreens.map((screen) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeScreen.id === screen.id}
                  className={activeScreen.id === screen.id ? "active" : ""}
                  onClick={() => setActiveScreen(screen)}
                  key={screen.id}
                >
                  <screen.Icon />
                  {screen.label}
                </button>
              ))}
            </div>

            <div className="screen-story">
              <span>{activeScreen.eyebrow}</span>
              <h3>{activeScreen.title}</h3>
              <p>{activeScreen.text}</p>
              <div className="story-marker">
                <Sparkles /> Designed to feel clear, rewarding, and distinctly
                JapLearn.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="students"
        className="audience-section student-promo"
        data-reveal
      >
        <div className="audience-visual student-visual">
          <span className="kana kana-one">あ</span>
          <span className="kana kana-two">語</span>
          <div className="progress-preview">
            <small>TODAY’S LEARNING PATH</small>
            <h3>Every small step counts.</h3>
            <div>
              <i />
              <span>Lesson progress</span>
              <b>75%</b>
            </div>
            <div className="preview-badges">
              <span>
                <BookOpen /> Learn
              </span>
              <span>
                <Gamepad2 /> Play
              </span>
              <span>
                <MessageCircleMore /> Speak
              </span>
            </div>
          </div>
        </div>
        <div className="audience-copy">
          <span className="section-kicker purple-kicker">FOR STUDENTS</span>
          <h2>Learning Japanese becomes something to look forward to.</h2>
          <p>
            Students move at a clear pace, apply what they learn in games and
            conversations, and see real progress without feeling overwhelmed.
          </p>
          <ul>
            <li>
              <CheckCircle2 /> Clear, guided learning paths
            </li>
            <li>
              <CheckCircle2 /> Engaging exercises and mini-games
            </li>
            <li>
              <CheckCircle2 /> Speaking and situational practice
            </li>
            <li>
              <CheckCircle2 /> Visible goals, mastery, and improvement
            </li>
          </ul>
        </div>
      </section>

      <section
        id="teachers"
        className="audience-section teacher-promo"
        data-reveal
      >
        <div className="audience-copy">
          <span className="section-kicker">FOR TEACHERS</span>
          <h2>A calmer, clearer way to lead every Japanese class.</h2>
          <p>
            The teacher portal keeps class management, learning content,
            communication activities, student performance, and reports in one
            professional workspace.
          </p>
          <ul>
            {teacherBenefits.map((benefit) => (
              <li key={benefit}>
                <CheckCircle2 /> {benefit}
              </li>
            ))}
          </ul>
          <Link className="primary light teacher-action" to="/teacher/login">
            Open the teacher portal <ArrowRight />
          </Link>
        </div>
        <div className="teacher-preview">
          <div className="preview-top">
            <GraduationCap />
            <span>
              <small>TEACHER WORKSPACE</small>
              <b>Your classroom at a glance</b>
            </span>
          </div>
          <div className="preview-stats">
            <article>
              <Users />
              <b>Students</b>
              <small>View live enrollment</small>
            </article>
            <article>
              <BookOpen />
              <b>Lessons</b>
              <small>Plan and organize</small>
            </article>
            <article>
              <BarChart3 />
              <b>Reports</b>
              <small>Understand progress</small>
            </article>
          </div>
        </div>
      </section>

      <section className="teacher-banner" data-reveal>
        <div>
          <span className="section-kicker">TEACH WITH PURPOSE</span>
          <h2>Help every learner take their next step in Japanese.</h2>
          <p>
            Use your existing teacher account to access the connected JapLearn
            classroom.
          </p>
        </div>
        <Link className="primary light" to="/teacher/login">
          Continue as teacher <ArrowRight />
        </Link>
      </section>

      <footer>
        <Brand />
        <p>Interactive Japanese learning for connected classrooms.</p>
        <span>© 2026 JapLearn</span>
      </footer>
    </main>
  );
}




