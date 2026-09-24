declare module '@payhere/payhere-mobilesdk-reactnative' {
  export interface PayHerePaymentObject {
    sandbox: boolean;
    merchant_id: string;
    notify_url?: string;
    order_id: string;
    items: string;
    amount: string;
    currency: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    delivery_address?: string;
    delivery_city?: string;
    delivery_country?: string;
    custom_1?: string;
    custom_2?: string;
    preapprove?: boolean;
    authorize?: boolean;
    recurrence?: string;
    duration?: string;
    startup_fee?: string;
    [key: string]: unknown;
  }

  interface PayHereSdk {
    startPayment(
      paymentObject: PayHerePaymentObject,
      onCompleted: (paymentId: string) => void,
      onError: (errorData: string) => void,
      onDismissed: () => void,
    ): void;
  }

  const PayHere: PayHereSdk;
  export default PayHere;
}
