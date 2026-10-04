import { getSession } from "./authService";

const API_BASE = "http://localhost:8080";

/** Envoie une image (importée depuis l'appareil) et retourne son URL publique. */
export async function uploadVehicleImage(file: File): Promise<string> {
  const session = getSession();
  if (!session) throw new Error("Vous devez être connecté en tant qu'administrateur.");

  const form = new FormData();
  form.append("file", file);
  form.append("adminUserId", String(session.userId));

  const res = await fetch(`${API_BASE}/api/uploads/vehicles`, { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;

  if (!res.ok || !data?.url) {
    throw new Error(data?.message ?? `Échec de l'envoi de l'image (${res.status}).`);
  }
  return data.url;
}