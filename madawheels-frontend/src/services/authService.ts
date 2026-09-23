import { callSoap, fieldText, NS } from "./soapClient";
import type { LoginResult, MwUser, RegisterResult } from "../types/user";

const SESSION_KEY = "mw_session";

type XmlContainer = {
  getElementsByTagNameNS(namespaceURI: string | null, localName: string): HTMLCollectionOf<Element>;
};

function parseUser(container: XmlContainer): MwUser {
  return {
    userId: Number(fieldText(container as Element, "userId")),
    firstName: fieldText(container as Element, "firstName"),
    lastName: fieldText(container as Element, "lastName"),
    email: fieldText(container as Element, "email"),
    phone: fieldText(container as Element, "phone"),
    role: fieldText(container as Element, "role"),
    status: fieldText(container as Element, "status"),
  };
}

function userFromResponse(doc: Document): MwUser {
  const el = doc.getElementsByTagNameNS(NS, "user")[0];
  return parseUser(el ?? doc.documentElement);
}

export async function register(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<RegisterResult> {
  const body = `<veh:registerRequest>
    <veh:firstName>${payload.firstName}</veh:firstName>
    <veh:lastName>${payload.lastName}</veh:lastName>
    <veh:email>${payload.email}</veh:email>
    <veh:phone>${payload.phone}</veh:phone>
    <veh:password>${payload.password}</veh:password>
  </veh:registerRequest>`;

  const doc = await callSoap(body);
  const root = doc.documentElement;
  return {
    userId: Number(fieldText(root, "userId")),
    status: fieldText(root, "status"),
    emailSent: fieldText(root, "emailSent") === "true",
    message: fieldText(root, "message"),
  };
}

export async function verifyCode(email: string, code: string): Promise<LoginResult> {
  const body = `<veh:verifyCodeRequest>
    <veh:email>${email}</veh:email>
    <veh:code>${code}</veh:code>
  </veh:verifyCodeRequest>`;

  const doc = await callSoap(body);
  return {
    success: fieldText(doc.documentElement, "success") === "true",
    user: userFromResponse(doc),
    message: fieldText(doc.documentElement, "message"),
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const body = `<veh:loginRequest>
    <veh:email>${email}</veh:email>
    <veh:password>${password}</veh:password>
  </veh:loginRequest>`;

  const doc = await callSoap(body);
  return {
    success: fieldText(doc.documentElement, "success") === "true",
    user: userFromResponse(doc),
    message: fieldText(doc.documentElement, "message"),
  };
}

export async function getUser(userId: number): Promise<MwUser> {
  const body = `<veh:getUserRequest>
    <veh:userId>${userId}</veh:userId>
  </veh:getUserRequest>`;

  const doc = await callSoap(body);
  return userFromResponse(doc);
}

export function saveSession(user: MwUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): MwUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MwUser;
  } catch {
    return null;
  }
}