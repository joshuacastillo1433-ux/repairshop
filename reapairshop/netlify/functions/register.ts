import { getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { full_name, username, email, contact, password, address } = body;

    // SERVER-SIDE VALIDATION
    if (!full_name || full_name.length < 3) {
      return Response.json({ error: "Full name too short" }, { status: 400 });
    }
    if (!username || username.length < 4) {
      return Response.json({ error: "Username must be at least 4 characters" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!contact || contact.length < 7) {
      return Response.json({ error: "Invalid contact number" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!address || address.length < 5) {
      return Response.json({ error: "Invalid address" }, { status: 400 });
    }

    // LOAD EXISTING USERS FROM SHARED STORAGE
    const usersStore = getStore("users");
    const existingUsers: any[] = (await usersStore.get("all", { type: "json" })) || [];

    // CHECK DUPLICATES
    if (existingUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return Response.json({ error: "Username already taken" }, { status: 400 });
    }
    if (existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    // HASH PASSWORD
    const passwordHash = await bcrypt.hash(password, 10);

    // CREATE NEW USER
    const newId = existingUsers.length > 0
      ? Math.max(...existingUsers.map((u) => u.id)) + 1
      : 1;

    const newUser = {
      id: newId,
      customer_code: `CUS-${String(newId).padStart(5, "0")}`,
      full_name,
      username,
      email,
      contact,
      password_hash: passwordHash,
      address,
      role: "Customer",
      status: "Active",
      registered_at: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    await usersStore.setJSON("all", existingUsers);

    // RETURN USER WITHOUT PASSWORD HASH
    const { password_hash, ...safeUser } = newUser;
    return Response.json({ success: true, user: safeUser });
  } catch (err) {
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
};