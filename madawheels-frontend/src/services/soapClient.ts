const SOAP_ENDPOINT = "http://localhost:8080/ws";
export const NS = "http://www.madawheels.com/vehicles";

/**
 * Envoie un corps SOAP (balises <veh:...>) au service et retourne le
 * document XML de la réponse, déjà parsé. Lève une erreur lisible si
 * le serveur renvoie un SOAP Fault (ex. validation métier côté service).
 */
export async function callSoap(bodyXml: string): Promise<Document> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:veh="${NS}">
  <soapenv:Header/>
  <soapenv:Body>
    ${bodyXml}
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(SOAP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/xml;charset=UTF-8" },
    body: envelope,
  });

  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");

  const fault = doc.getElementsByTagName("faultstring")[0];
  if (fault) {
    throw new Error(fault.textContent ?? "Erreur SOAP inconnue.");
  }
  if (!res.ok) {
    throw new Error(`Erreur SOAP (${res.status})`);
  }

  return doc;
}

/** Lit le texte d'un élément par son nom local, sans se soucier du préfixe. */
export function fieldText(node: Element, localName: string): string {
  const el = node.getElementsByTagNameNS(NS, localName)[0];
  return el?.textContent?.trim() ?? "";
}