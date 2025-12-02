import { Timestamp } from "firebase/firestore";

export type DeliveryEntry = {
  id: string;
  date: Timestamp | Date;
  deliveryBoyName: string;
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
export const COMPANY_RATE = 19;
