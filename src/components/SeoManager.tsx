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
    title: "JapLearn | Interactive Japanese Learning",
    description:
      "Discover JapLearn, an interactive Japanese learning platform with guided lessons, games, speaking practice, classroom tools, and progress insights.",
    index: true,
  },
  "/teacher/login": {
    title: "Teacher Sign In | JapLearn Teacher Portal",
    description:
      "Sign in to the JapLearn Teacher Portal to manage classes, guide learners, assign activities, and review Japanese learning progress.",
    index: true,
  },
  "/teacher/create-account": {
    title: "Create a Teacher Account | JapLearn",
    description:
      "Create a JapLearn teacher account and start organizing Japanese classes, learners, lessons, communication activities, and reports.",
    index: true,
  },
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
