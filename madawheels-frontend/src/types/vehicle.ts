export interface Vehicle {
    id: number;
    name: string;
    type: string;
    price: number;
    available: boolean;
}

export interface SearchParams {
    departure: string;
    destination: string;
    date: string;
    time: string;
}