import { callSoap, fieldText, NS } from "./soapClient";
import type { Vehicle } from "../types/vehicle";
import type { AdminReservation, ClientSummary, Transaction, AdminStats } from "../types/admin";
import { getSession } from "./authService";

function currentAdminId(): number {
  const session = getSession();
  if (!session) throw new Error("Vous devez être connecté en tant qu'administrateur.");
  return session.userId;
}

/** Échappe les caractères spéciaux XML (&, <, >) pour ne pas casser l'enveloppe SOAP. */
const esc = (v: unknown): string =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function listReservationsForAdmin(status?: string): Promise<AdminReservation[]> {
  const body = `<veh:listReservationsForAdminRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    ${status ? `<veh:status>${esc(status)}</veh:status>` : ""}
  </veh:listReservationsForAdminRequest>`;
  const doc = await callSoap(body);
  return Array.from(doc.getElementsByTagNameNS(NS, "reservation")).map((r) => ({
    reservationId: Number(fieldText(r, "reservationId")),
    reference: fieldText(r, "reference"),
    status: fieldText(r, "status"),
    userId: Number(fieldText(r, "userId")),
    vehicleId: Number(fieldText(r, "vehicleId")),
    departure: fieldText(r, "departure"),
    returnLocation: fieldText(r, "returnLocation"),
    startDate: fieldText(r, "startDate"),
    endDate: fieldText(r, "endDate"),
    totalPrice: Number(fieldText(r, "totalPrice")),
    adminNote: fieldText(r, "adminNote"),
    createdAt: fieldText(r, "createdAt"),
  }));
}

export async function validateReservation(reservationId: number, adminNote = "") {
  const body = `<veh:validateReservationRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    <veh:reservationId>${reservationId}</veh:reservationId>
    ${adminNote ? `<veh:adminNote>${esc(adminNote)}</veh:adminNote>` : ""}
  </veh:validateReservationRequest>`;
  const doc = await callSoap(body);
  return {
    status: fieldText(doc.documentElement, "status"),
    emailSent: fieldText(doc.documentElement, "emailSent") === "true",
    message: fieldText(doc.documentElement, "message"),
  };
}

export async function refuseReservation(reservationId: number, reason = "") {
  const body = `<veh:refuseReservationRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    <veh:reservationId>${reservationId}</veh:reservationId>
    ${reason ? `<veh:reason>${esc(reason)}</veh:reason>` : ""}
  </veh:refuseReservationRequest>`;
  const doc = await callSoap(body);
  return { status: fieldText(doc.documentElement, "status"), message: fieldText(doc.documentElement, "message") };
}

export async function createVehicle(v: Omit<Vehicle, "id">): Promise<number> {
  const body = `<veh:createVehicleRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    <veh:name>${esc(v.name)}</veh:name>
    <veh:brand>${esc(v.brand)}</veh:brand>
    <veh:model>${esc(v.model)}</veh:model>
    <veh:type>${esc(v.type)}</veh:type>
    <veh:transmission>${esc(v.transmission)}</veh:transmission>
    <veh:seats>${v.seats}</veh:seats>
    <veh:doors>${v.doors}</veh:doors>
    <veh:fuel>${esc(v.fuel)}</veh:fuel>
    <veh:pricePerDay>${v.pricePerDay}</veh:pricePerDay>
    <veh:imageUrl>${esc(v.imageUrl ?? "")}</veh:imageUrl>
    <veh:description>${esc(v.description ?? "")}</veh:description>
    <veh:departure>${esc(v.departure)}</veh:departure>
    <veh:available>${v.available ?? true}</veh:available>
  </veh:createVehicleRequest>`;
  const doc = await callSoap(body);
  return Number(fieldText(doc.documentElement, "vehicleId"));
}

export async function updateVehicle(id: number, patch: Partial<Vehicle>): Promise<void> {
  const tag = (n: string, val?: string | number | boolean) =>
    val === undefined || val === null || val === "" ? "" : `<veh:${n}>${esc(val)}</veh:${n}>`;
  const body = `<veh:updateVehicleRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    <veh:vehicleId>${id}</veh:vehicleId>
    ${tag("name", patch.name)}
    ${tag("brand", patch.brand)}
    ${tag("model", patch.model)}
    ${tag("type", patch.type)}
    ${tag("transmission", patch.transmission)}
    ${tag("seats", patch.seats)}
    ${tag("doors", patch.doors)}
    ${tag("fuel", patch.fuel)}
    ${tag("pricePerDay", patch.pricePerDay)}
    ${tag("imageUrl", patch.imageUrl)}
    ${tag("description", patch.description)}
    ${tag("departure", patch.departure)}
    ${patch.available !== undefined ? `<veh:available>${patch.available}</veh:available>` : ""}
  </veh:updateVehicleRequest>`;
  await callSoap(body);
}

export async function deleteVehicle(id: number): Promise<string> {
  const body = `<veh:deleteVehicleRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    <veh:vehicleId>${id}</veh:vehicleId>
  </veh:deleteVehicleRequest>`;
  const doc = await callSoap(body);
  return fieldText(doc.documentElement, "message");
}

export async function adminSearchVehicles(keyword = "", departure = ""): Promise<Vehicle[]> {
  const body = `<veh:adminSearchVehiclesRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
    ${keyword ? `<veh:keyword>${esc(keyword)}</veh:keyword>` : ""}
    ${departure ? `<veh:departure>${esc(departure)}</veh:departure>` : ""}
  </veh:adminSearchVehiclesRequest>`;
  const doc = await callSoap(body);
  return Array.from(doc.getElementsByTagNameNS(NS, "vehicle")).map((v) => ({
    id: Number(fieldText(v, "id")),
    name: fieldText(v, "name"),
    brand: fieldText(v, "brand"),
    model: fieldText(v, "model"),
    type: fieldText(v, "type"),
    transmission: fieldText(v, "transmission"),
    seats: Number(fieldText(v, "seats")),
    doors: Number(fieldText(v, "doors")),
    fuel: fieldText(v, "fuel"),
    pricePerDay: Number(fieldText(v, "pricePerDay")),
    imageUrl: fieldText(v, "imageUrl"),
    description: fieldText(v, "description"),
    departure: fieldText(v, "departure"),
    available: fieldText(v, "available") === "true",
  }));
}

/** Liste des comptes clients (CRM basique côté admin). */
export async function listClientsForAdmin(): Promise<ClientSummary[]> {
  const body = `<veh:listClientsForAdminRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
  </veh:listClientsForAdminRequest>`;
  const doc = await callSoap(body);
  return Array.from(doc.getElementsByTagNameNS(NS, "client")).map((c) => ({
    userId: Number(fieldText(c, "userId")),
    firstName: fieldText(c, "firstName"),
    lastName: fieldText(c, "lastName"),
    email: fieldText(c, "email"),
    phone: fieldText(c, "phone"),
    status: fieldText(c, "status"),
    reservationsCount: Number(fieldText(c, "reservationsCount")),
  }));
}

/** Liste des réservations payées (statut TERMINEE), avec client et véhicule résolus. */
export async function listTransactionsForAdmin(): Promise<Transaction[]> {
  const body = `<veh:listTransactionsForAdminRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
  </veh:listTransactionsForAdminRequest>`;
  const doc = await callSoap(body);
  return Array.from(doc.getElementsByTagNameNS(NS, "transaction")).map((t) => ({
    reservationId: Number(fieldText(t, "reservationId")),
    reference: fieldText(t, "reference"),
    status: fieldText(t, "status"),
    clientFirstName: fieldText(t, "clientFirstName"),
    clientLastName: fieldText(t, "clientLastName"),
    clientEmail: fieldText(t, "clientEmail"),
    clientPhone: fieldText(t, "clientPhone"),
    vehicleName: fieldText(t, "vehicleName"),
    departure: fieldText(t, "departure"),
    returnLocation: fieldText(t, "returnLocation"),
    startDate: fieldText(t, "startDate"),
    endDate: fieldText(t, "endDate"),
    vehiclePrice: Number(fieldText(t, "vehiclePrice")),
    optionsPrice: Number(fieldText(t, "optionsPrice")),
    totalPrice: Number(fieldText(t, "totalPrice")),
    paymentMethod: fieldText(t, "paymentMethod"),
    cardHolder: fieldText(t, "cardHolder"),
    cardLastFour: fieldText(t, "cardLastFour"),
    paidAt: fieldText(t, "paidAt"),
    createdAt: fieldText(t, "createdAt"),
  }));
}

/** Compteurs pour le tableau de bord admin. */
export async function getAdminStats(): Promise<AdminStats> {
  const body = `<veh:adminStatsRequest>
    <veh:adminUserId>${currentAdminId()}</veh:adminUserId>
  </veh:adminStatsRequest>`;
  const doc = await callSoap(body);
  const root = doc.documentElement;
  return {
    totalClients: Number(fieldText(root, "totalClients")),
    totalVehicles: Number(fieldText(root, "totalVehicles")),
    availableVehicles: Number(fieldText(root, "availableVehicles")),
    pendingReservations: Number(fieldText(root, "pendingReservations")),
    validatedReservations: Number(fieldText(root, "validatedReservations")),
    completedReservations: Number(fieldText(root, "completedReservations")),
    refusedReservations: Number(fieldText(root, "refusedReservations")),
  };
}