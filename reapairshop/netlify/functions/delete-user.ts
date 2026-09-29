import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const adminPass = req.headers.get("x-admin-password");
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

  if (adminPass !== expectedPass) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    const usersStore = getStore("users");
    let users: any[] = (await usersStore.get("all", { type: "json" })) || [];

    users = users.filter((u) => u.id !== id);
    await usersStore.setJSON("all", users);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
};