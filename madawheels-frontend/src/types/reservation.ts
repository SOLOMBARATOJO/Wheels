import type { SelectedOption } from "./vehicle";

export interface ReservationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: number;
  departure: string;
  returnLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  driverAge: number;
  options: SelectedOption[];
}

export interface ReservationOptionLine {
  optionId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReservationResult {
  reservationId: number;
  reference: string;
  status: string;
  vehiclePrice: number;
  optionsPrice: number;
  totalPrice: number;
  emailSent: boolean;
  options: ReservationOptionLine[];
}

export interface ReservationSummary {
  reservationId: number;
  reference: string;
  status: string;
  vehicleId: number;
  vehicleName: string;
  vehicleImage?: string;
  departure: string;
  returnLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  vehiclePrice: number;
  optionsPrice: number;
  totalPrice: number;
  createdAt?: string;
  options: ReservationOptionLine[];
  paymentMethod?: string;
  cardHolder?: string;
  cardLast4?: string;
  paidAt?: string;
  refusalReason?: string;
}