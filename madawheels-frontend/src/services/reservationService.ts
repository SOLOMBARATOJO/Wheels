import { callSoap, fieldText, NS } from "./soapClient";
import type { ReservationRequest, ReservationResult, ReservationOptionLine, ReservationSummary } from "../types/reservation";

type XmlContainer = {
  getElementsByTagNameNS(namespaceURI: string | null, localName: string): HTMLCollectionOf<Element>;
};

function parseOptionLines(container: XmlContainer): ReservationOptionLine[] {
  return Array.from(container.getElementsByTagNameNS(NS, "option")).map((o) => ({
    optionId: Number(fieldText(o, "optionId")),
    name: fieldText(o, "name"),
    quantity: Number(fieldText(o, "quantity")),
    unitPrice: Number(fieldText(o, "unitPrice")),
    totalPrice: Number(fieldText(o, "totalPrice")),
  }));
}

export async function createReservation(r: ReservationRequest): Promise<ReservationResult> {
  const optionsXml = r.options
    .map(
      (o) =>
        `<veh:selectedOption><veh:optionId>${o.optionId}</veh:optionId><veh:quantity>${o.quantity}</veh:quantity></veh:selectedOption>`
    )
    .join("");

  const body = `<veh:createReservationRequest>
    <veh:firstName>${r.firstName}</veh:firstName>
    <veh:lastName>${r.lastName}</veh:lastName>
    <veh:email>${r.email}</veh:email>
    <veh:phone>${r.phone}</veh:phone>
    <veh:vehicleId>${r.vehicleId}</veh:vehicleId>
    <veh:departure>${r.departure}</veh:departure>
    <veh:returnLocation>${r.returnLocation}</veh:returnLocation>
    <veh:startDate>${r.startDate}</veh:startDate>
    <veh:startTime>${r.startTime}</veh:startTime>
    <veh:endDate>${r.endDate}</veh:endDate>
    <veh:endTime>${r.endTime}</veh:endTime>
    <veh:driverAge>${r.driverAge}</veh:driverAge>
    ${optionsXml}
  </veh:createReservationRequest>`;

  const doc = await callSoap(body);
  const root = doc.documentElement;

  return {
    reservationId: Number(fieldText(root, "reservationId")),
    reference: fieldText(root, "reference"),
    status: fieldText(root, "status"),
    vehiclePrice: Number(fieldText(root, "vehiclePrice")),
    optionsPrice: Number(fieldText(root, "optionsPrice")),
    totalPrice: Number(fieldText(root, "totalPrice")),
    emailSent: fieldText(root, "emailSent") === "true",
    options: parseOptionLines(doc),
  };
}

export async function findReservations(email: string): Promise<ReservationSummary[]> {
  const body = `<veh:findReservationsRequest>
    <veh:email>${email}</veh:email>
  </veh:findReservationsRequest>`;

  const doc = await callSoap(body);

  return Array.from(doc.getElementsByTagNameNS(NS, "reservation")).map((r) => ({
    reservationId: Number(fieldText(r, "reservationId")),
    reference: fieldText(r, "reference"),
    status: fieldText(r, "status"),
    vehicleId: Number(fieldText(r, "vehicleId")),
    vehicleName: fieldText(r, "vehicleName"),
    vehicleImage: fieldText(r, "vehicleImage"),
    departure: fieldText(r, "departure"),
    returnLocation: fieldText(r, "returnLocation"),
    startDate: fieldText(r, "startDate"),
    startTime: fieldText(r, "startTime"),
    endDate: fieldText(r, "endDate"),
    endTime: fieldText(r, "endTime"),
    vehiclePrice: Number(fieldText(r, "vehiclePrice")),
    optionsPrice: Number(fieldText(r, "optionsPrice")),
    totalPrice: Number(fieldText(r, "totalPrice")),
    createdAt: fieldText(r, "createdAt"),
    options: parseOptionLines(r),
  }));
}