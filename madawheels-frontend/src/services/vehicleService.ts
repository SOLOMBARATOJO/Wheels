import { callSoap, fieldText, NS } from "./soapClient";
import type { Vehicle, SearchParams } from "../types/vehicle";

function parseVehicles(doc: Document): Vehicle[] {
  const nodes = Array.from(doc.getElementsByTagNameNS(NS, "vehicle"));
  return nodes.map((v) => ({
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

export async function searchVehicles(params: SearchParams): Promise<Vehicle[]> {
  const optional = (tag: string, value?: string | number) =>
    value === undefined || value === null || value === "" ? "" : `<veh:${tag}>${value}</veh:${tag}>`;

  const body = `<veh:searchVehiclesRequest>
    <veh:departure>${params.departure}</veh:departure>
    <veh:returnLocation>${params.returnLocation}</veh:returnLocation>
    <veh:startDate>${params.startDate}</veh:startDate>
    <veh:startTime>${params.startTime}</veh:startTime>
    <veh:endDate>${params.endDate}</veh:endDate>
    <veh:endTime>${params.endTime}</veh:endTime>
    <veh:driverAge>${params.driverAge}</veh:driverAge>
    ${optional("type", params.type)}
    ${optional("transmission", params.transmission)}
    ${optional("fuel", params.fuel)}
    ${optional("maxPrice", params.maxPrice)}
  </veh:searchVehiclesRequest>`;
  const doc = await callSoap(body);
  return parseVehicles(doc);
}