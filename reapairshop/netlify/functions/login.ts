import { getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return Response.json({ error: "Please enter both fields" }, { status: 400 });
    }

    const usersStore = getStore("users");
    const users: any[] = (await usersStore.get("all", { type: "json" })) || [];

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      return Response.json({ error: "No account found" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: "Incorrect password" }, { status: 401 });
    }

    if (user.status !== "Active") {
      return Response.json({ error: "Account is inactive" }, { status: 401 });
    }

    const { password_hash, ...safeUser } = user;
    return Response.json({ success: true, user: safeUser });
  } catch (err) {
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
};