export interface AdminReservation {
  reservationId: number;
  reference: string;
  status: string;
  userId: number;
  vehicleId: number;
  departure: string;
  returnLocation: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  adminNote?: string;
  createdAt?: string;
}

export interface ClientSummary {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  reservationsCount: number;
}

export interface Transaction {
  reservationId: number;
  reference: string;
  status: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  vehicleName: string;
  departure: string;
  returnLocation: string;
  startDate: string;
  endDate: string;
  vehiclePrice: number;
  optionsPrice: number;
  totalPrice: number;
  paymentMethod: string;
  cardHolder: string;
  cardLastFour: string;
  paidAt: string;
  createdAt: string;
}

export interface AdminStats {
  totalClients: number;
  totalVehicles: number;
  availableVehicles: number;
  pendingReservations: number;
  validatedReservations: number;
  completedReservations: number;
  refusedReservations: number;
}