import type { Vehicle, SearchParams } from '../types/vehicle';

const SOAP_ENDPOINT = 'http://localhost:8080/ws';
const NAMESPACE = 'http://www.madawheels.com/vehicles';

export interface SearchResult {
    vehicles: Vehicle[];
    requestXml: string;
    responseXml: string;
}

function buildSoapEnvelope(params: SearchParams): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                   xmlns:veh="${NAMESPACE}">
    <soapenv:Header/>
    <soapenv:Body>
        <veh:searchVehiclesRequest>
            <veh:departure>${params.departure}</veh:departure>
            <veh:destination>${params.destination}</veh:destination>
            <veh:date>${params.date}</veh:date>
            <veh:time>${params.time}</veh:time>
        </veh:searchVehiclesRequest>
    </soapenv:Body>
</soapenv:Envelope>`;
}

function parseSoapResponse(xmlText: string): Vehicle[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const vehicleNodes = xmlDoc.getElementsByTagNameNS(NAMESPACE, 'vehicle');
    const vehicles: Vehicle[] = [];

    for (let i = 0; i < vehicleNodes.length; i++) {
        const node = vehicleNodes[i];

        const getText = (tag: string): string => {
            const el = node.getElementsByTagNameNS(NAMESPACE, tag)[0];
            return el?.textContent ?? '';
        };

        vehicles.push({
            id: Number(getText('id')),
            name: getText('name'),
            type: getText('type'),
            price: Number(getText('price')),
            available: getText('available') === 'true',
        });
    }

    return vehicles;
}

export function formatXml(xml: string): string {
    const PADDING = '  ';
    // eslint-disable-next-line prefer-const
    let formatted = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
    let pad = 0;

    return formatted
        .split('\n')
        .map((line) => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/)) {
                if (pad !== 0) pad -= 1;
            } else if (line.match(/^<\w[^>]*[^/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }
            const padding = PADDING.repeat(Math.max(pad, 0));
            pad += indent;
            return padding + line;
        })
        .join('\n')
        .trim();
}

export async function searchVehicles(params: SearchParams): Promise<SearchResult> {
    const requestXml = buildSoapEnvelope(params);

    const response = await fetch(SOAP_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
        },
        body: requestXml,
    });

    if (!response.ok) {
        throw new Error(`Erreur SOAP : ${response.status}`);
    }

    const responseXml = await response.text();
    const vehicles = parseSoapResponse(responseXml);

    return { vehicles, requestXml, responseXml };
}