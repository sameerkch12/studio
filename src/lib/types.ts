import { Timestamp } from "firebase/firestore";

export const Pincodes = {
  BHILAI_3: "490021",
  CHARODA: "490025",
} as const;

export type Pincode = typeof Pincodes[keyof typeof Pincodes];

export const COMPANY_RATES: Record<Pincode, number> = {
  [Pincodes.BHILAI_3]: 19,
  [Pincodes.CHARODA]: 35,
};

export type DeliveryEntry = {
  id: string;
  date: Timestamp | Date;
  deliveryBoyName: string;
  pincode: Pincode;
  delivered: number;
  returned: number;
  expectedCod: number;
  actualCodCollected: number;
  codShortageReason?: string;
  rvp: number;
  advance: number; // This remains for advances given on the same day as an entry
};

export type AdvancePayment = {
  id: string;
  date: Timestamp | Date;
  deliveryBoyName: string;
  amount: number;
};

export type CompanyCodPayment = {
    id: string;
    date: Timestamp | Date;
    amount: number;
    notes?: string;
};

export type DeliveryBoy = {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export const DELIVERY_BOY_RATE = 14;
// COMPANY_RATE is now dynamic based on pincode
