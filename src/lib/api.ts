export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export type PortalRole = "teacher" | "admin";

export type User = {
  userId: string;
  email: string;
  fname: string;
  lname: string;
  role: string;
};

async function readError(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text)?.message || text;
  } catch {
    return text;
  }
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
  };
}
