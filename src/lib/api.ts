const LOCAL_API_URL = "http://localhost:8080";
const RENDER_API_URL = "https://japlearn2-0.onrender.com";

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? LOCAL_API_URL : RENDER_API_URL)
).replace(/\/$/, "");

export type PortalRole = "teacher" | "admin";

export type User = {
  userId: string;
  email: string;
  fname: string;
  lname: string;
  role: string;
  apiToken?: string;
};

async function readError(response: Response) {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text);
    return parsed?.error || parsed?.message || text;
  } catch {
    return text;
  }
}

export type TeacherRegistration = {
  fname: string;
  lname: string;
  email: string;
  password: string;
};

export async function registerTeacher(values: TeacherRegistration) {
  const response = await fetch(`${API_URL}/api/users/register-teacher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fname: values.fname.trim(),
      lname: values.lname.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    }),
  });

  if (!response.ok) {
    throw new Error((await readError(response)) || "Account creation failed.");
  }

  return response.json();
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  const response = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      (await readError(response)) || "Email or password is incorrect.",
    );
  }

  const data = await response.json();

  return {
    userId: String(data.id || data.userId || ""),
    email: data.email,
    fname: data.fname,
    lname: data.lname,
    role: String(data.role || "").toLowerCase(),
    apiToken: data.apiToken,
  };
}
