import { saltAndHashPassword } from "@/lib/server-helpers";

export default function DebugPage() {
  const password = 'admin';
  const hashedPassword = saltAndHashPassword(password);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded break-all">
        <p><strong>Password:</strong> {password}</p>
        <p><strong>Hashed Password:</strong> {hashedPassword}</p>
      </div>
    </div>
  );
}