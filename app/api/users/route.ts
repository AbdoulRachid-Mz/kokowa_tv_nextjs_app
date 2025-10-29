import db from "@/lib/db";

export async function GET(): Promise<Response> {

  const [rows] = await db.query("SELECT * FROM users");
  await db.end();
  return Response.json(rows);
}

export async function POST(req: Request): Promise<Response> {
  const { name, email }: { name: string; email: string } = await req.json();

  await db.query("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
  await db.end();

  return Response.json({ message: "Utilisateur ajouté ✅" });
}
