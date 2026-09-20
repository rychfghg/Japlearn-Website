import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://portal.japlearn.com";

type SeoDetails = {
  title: string;
  description: string;
  index: boolean;
};

const PUBLIC_ROUTES: Record<string, SeoDetails> = {
  "/": {
    title: "JapLearn | Learn Japanese Online with Lessons, Games & Speaking Practice",
    description:
      "Learn Japanese with JapLearn: hiragana, katakana, vocabulary and grammar lessons, fun games, AI speaking practice, and a free teacher portal to track class progress.",
    index: true,
  },
  "/teacher/login": {
    title: "Teacher Sign In | JapLearn Teacher Portal",
    description:
      "Sign in to the JapLearn Teacher Portal to manage classes, guide learners, assign activities, and review Japanese learning progress.",
    index: true,
  },
  "/teacher/create-account": {
    title: "Create a Free Teacher Account | JapLearn Japanese Classroom",
    description:
      "Create a JapLearn teacher account and start organizing Japanese classes, learners, lessons, communication activities, and reports.",
    index: true,
  },
  "/teacher/reset-password": {
    title: "Reset Password | JapLearn Teacher Portal",
    description: "Set a new password for your JapLearn teacher account.",
    index: false,
  },
  "/delete-account": {
    title: "Delete Your Account | JapLearn",
    description:
      "Request permanent deletion of your JapLearn account and learning data. We email a confirmation link so only the account owner can complete it.",
    index: true,
  },
  "/delete-account/confirm": {
    title: "Confirm Account Deletion | JapLearn",
    description: "Confirm the permanent deletion of your JapLearn account.",
    index: false,
  },
  "/privacy": { title: "Privacy Policy | JapLearn", description: "Learn how JapLearn handles account, classroom, progress, and speaking-practice information.", index: true },
  "/terms": { title: "Terms of Use | JapLearn", description: "Read the terms for using the JapLearn Android app, web experience, and teacher portal.", index: true },
  "/accessibility": { title: "Accessibility | JapLearn", description: "Learn about JapLearn's approach to accessible Japanese learning on Android and the web.", index: true },
  "/contact": { title: "Help and Contact | JapLearn", description: "Contact JapLearn for account, classroom, technical, privacy, or general support.", index: true },
};

const PRIVATE_SEO: SeoDetails = {
  title: "Secure Workspace | JapLearn",
  description: "Secure JapLearn teacher and administrator workspace.",
  index: false,
};

function upsertMeta(selector: string, attribute: "name" | "property", key: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  return element;
}

function setMeta(name: string, content: string) {
  upsertMeta(`meta[name="${name}"]`, "name", name).content = content;
}

function setProperty(property: string, content: string) {
  upsertMeta(`meta[property="${property}"]`, "property", property).content =
    content;
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = PUBLIC_ROUTES[location.pathname] ?? PRIVATE_SEO;
    const canonicalUrl = `${SITE_ORIGIN}${location.pathname === "/" ? "/" : location.pathname}`;
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    document.title = seo.title;
    canonical.href = canonicalUrl;

    setMeta("description", seo.description);
    setMeta(
      "robots",
      seo.index
        ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        : "noindex,nofollow,noarchive,nosnippet",
    );
    setProperty("og:title", seo.title);
    setProperty("og:description", seo.description);
    setProperty("og:url", canonicalUrl);
    setMeta("twitter:title", seo.title);
    setMeta("twitter:description", seo.description);
  }, [location.pathname]);

  return null;
}
