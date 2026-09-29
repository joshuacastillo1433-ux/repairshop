import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  // Simple admin password check
  const adminPass = req.headers.get("x-admin-password");
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

  if (adminPass !== expectedPass) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersStore = getStore("users");
  const users: any[] = (await usersStore.get("all", { type: "json" })) || [];

  // Strip password hashes
  const safeUsers = users.map((u) => {
    const { password_hash, ...rest } = u;
    return rest;
  });

  return Response.json({ users: safeUsers });
};