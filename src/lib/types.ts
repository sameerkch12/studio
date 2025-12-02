export type DeliveryEntry = {
  id: string;
  date: Date;
  deliveryBoyName: string;
  delivered: number;
  returned: number;
  codCollected: number;
  rvp: number;
};

export const DELIVERY_BOY_RATE = 14;
export const COMPANY_RATE = 19;
