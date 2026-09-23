export const AGENCIES = [
  "Tananarivo Ivato",
  "Tananarivo Centre",
  "Tamatave",
  "Nosy Be",
  "Toliara",
];

export interface FleetOption {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

// Miroir de la table `options` du backend (id 1 = chauffeur en ville,
// id 5 = chauffeur hors de la ville). Les autres options restent en BDD.
export const OPTIONS_CATALOG: FleetOption[] = [
  { id: 1, name: "Service chauffeur (en ville)", description: "Transport assuré par un chauffeur professionnel pour vos déplacements en ville", price: 15, unit: "jour" },
  { id: 5, name: "Service chauffeur (en dehors de la ville)", description: "Service de chauffeur pour vos trajets longue distance hors de la ville", price: 20, unit: "jour" },
];

export const VEHICLE_TYPES = [
  { value: "Légère", icon: "🚗" },
  { value: "Utilitaire", icon: "🚙" },
  { value: "4WD", icon: "🚜" },
  { value: "SUV", icon: "🚘" },
  { value: "Minivan", icon: "🚐" },
];

// Franchise d'assurance par catégorie de véhicule (design Figma).
export const FRANCHISE_BY_TYPE: Record<string, number> = {
  SUV: 3600,
  Minivan: 3500,
  "4WD": 1500,
  Légère: 900,
};

export const FRANCHISE_DEFAULT = 2500;
export const RESTITUTION_FEE = 650;

export function franchise(type: string): number {
  return FRANCHISE_BY_TYPE[type] ?? FRANCHISE_DEFAULT;
}