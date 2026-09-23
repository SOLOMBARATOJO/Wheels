export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: string;
  transmission: string;
  seats: number;
  doors: number;
  fuel: string;
  pricePerDay: number;
  imageUrl?: string;
  description?: string;
  departure: string;
  available: boolean;
}

export interface SearchParams {
  departure: string;
  returnLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  driverAge: number;
  type?: string;
  transmission?: string;
  fuel?: string;
  maxPrice?: number;
}

export interface CarOption {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export interface SelectedOption {
  optionId: number;
  quantity: number;
}