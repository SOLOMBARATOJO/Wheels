import { callSoap, fieldText, NS } from "./soapClient";
import { getSession, saveSession } from "./authService";
import type { MwUser } from "../types/user";

export interface AdminClient {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  reservationCount: number;
  paidCount: number;
  totalSpent: number;
}

export interface AdminTransaction {
  reservationId: number;
  reference: string;
  status: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  paymentMethod: string;
  cardHolder: string;
  cardLast4: string;
  paidAt: string;
}

const esc = (v: unknown): string =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function adminId(): number {
  const s = getSession();
  if (!s) throw new Error("Vous devez être connecté en tant qu'administrateur.");
  return s.userId;
}

/* ---------- Formats partagés ---------- */
export const formatEur = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;

export const formatDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("fr-FR");
};

export const formatDateTime = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

export const initials = (first: string, last: string) =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";

/* ---------- Clients ---------- */
export async function listClients(keyword = ""): Promise<AdminClient[]> {
  const body = `<veh:listClientsForAdminRequest>
    <veh:adminUserId>${adminId()}</veh:adminUserId>
    ${keyword ? `<veh:keyword>${esc(keyword)}</veh:keyword>` : ""}
  </veh:listClientsForAdminRequest>`;
  const doc = await callSoap(body);
  return Array.from(doc.getElementsByTagNameNS(NS, "client")).map((c) => ({
    userId: Number(fieldText(c, "userId")),
    firstName: fieldText(c, "firstName"),
    lastName: fieldText(c, "lastName"),
    email: fieldText(c, "email"),
    phone: fieldText(c, "phone"),
    status: fieldText(c, "status"),
    createdAt: fieldText(c, "createdAt"),
    reservationCount: Number(fieldText(c, "reservationCount")),
    paidCount: Number(fieldText(c, "paidCount")),
    totalSpent: Number(fieldText(c, "totalSpent")),
  }));
}

/* ---------- Transactions ---------- */
export async function listTransactions(): Promise<{ transactions: AdminTransaction[]; totalRevenue: number }> {
  const body = `<veh:listTransactionsForAdminRequest>
    <veh:adminUserId>${adminId()}</veh:adminUserId>
  </veh:listTransactionsForAdminRequest>`;
  const doc = await callSoap(body);
  const transactions = Array.from(doc.getElementsByTagNameNS(NS, "transaction")).map((t) => ({
    reservationId: Number(fieldText(t, "reservationId")),
    reference: fieldText(t, "reference"),
    status: fieldText(t, "status"),
    clientId: Number(fieldText(t, "clientId")),
    clientName: fieldText(t, "clientName"),
    clientEmail: fieldText(t, "clientEmail"),
    clientPhone: fieldText(t, "clientPhone"),
    vehicleName: fieldText(t, "vehicleName"),
    startDate: fieldText(t, "startDate"),
    endDate: fieldText(t, "endDate"),
    totalPrice: Number(fieldText(t, "totalPrice")),
    paymentMethod: fieldText(t, "paymentMethod"),
    cardHolder: fieldText(t, "cardHolder"),
    cardLast4: fieldText(t, "cardLast4"),
    paidAt: fieldText(t, "paidAt"),
  }));
  return { transactions, totalRevenue: Number(fieldText(doc.documentElement, "totalRevenue")) || 0 };
}

/* ---------- Paramètres du compte ---------- */
export async function updateProfile(p: { firstName: string; lastName: string; phone: string }): Promise<MwUser> {
  const session = getSession();
  if (!session) throw new Error("Session expirée. Reconnectez-vous.");
  const body = `<veh:updateProfileRequest>
    <veh:userId>${session.userId}</veh:userId>
    <veh:firstName>${esc(p.firstName)}</veh:firstName>
    <veh:lastName>${esc(p.lastName)}</veh:lastName>
    ${p.phone ? `<veh:phone>${esc(p.phone)}</veh:phone>` : ""}
  </veh:updateProfileRequest>`;
  const doc = await callSoap(body);
  const u = doc.getElementsByTagNameNS(NS, "user")[0];
  const updated: MwUser = {
    ...session,
    firstName: fieldText(u, "firstName"),
    lastName: fieldText(u, "lastName"),
    phone: fieldText(u, "phone"),
  };
  saveSession(updated);
  return updated;
}

export async function changePassword(current: string, next: string): Promise<string> {
  const session = getSession();
  if (!session) throw new Error("Session expirée. Reconnectez-vous.");
  const body = `<veh:changePasswordRequest>
    <veh:userId>${session.userId}</veh:userId>
    <veh:currentPassword>${esc(current)}</veh:currentPassword>
    <veh:newPassword>${esc(next)}</veh:newPassword>
  </veh:changePasswordRequest>`;
  const doc = await callSoap(body);
  return fieldText(doc.documentElement, "message");
}