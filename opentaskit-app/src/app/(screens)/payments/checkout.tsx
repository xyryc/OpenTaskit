import React, { useEffect, useMemo, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import PayHere from '@payhere/payhere-mobilesdk-reactnative';

import { useApp } from '@/contexts/AppContext';
import { useVerifyPaymentMutation, useCompleteTaskMutation } from '@/store/api/apiSlice';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import type { InitiateCheckoutResponse } from '@/types';

// PayHere's native SDK opens its own in-app checkout UI directly (no
// WebView, no hosted-checkout domain restriction) - this screen just kicks
// it off and reflects the outcome, it doesn't render any UI of its own.
export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const { toast } = useApp();
  const { checkoutParams, taskId } = useLocalSearchParams<{
    checkoutParams: string;
    taskId: string;
  }>();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [completeTaskApi] = useCompleteTaskMutation();
  const started = useRef(false);

  console.log('[PayHere] checkout screen rendered, raw params:', checkoutParams, taskId);

  const params: InitiateCheckoutResponse | null = useMemo(() => {
    try {
      return checkoutParams ? JSON.parse(checkoutParams) : null;
    } catch (e) {
      console.error('[PayHere] failed to parse checkoutParams:', e);
      return null;
    }
  }, [checkoutParams]);

  useEffect(() => {
    if (!params || !taskId || started.current) return;
    started.current = true;

    const paymentObject = {
      sandbox: params.sandbox,
      merchant_id: params.merchant_id,
      notify_url: params.notify_url,
      order_id: params.order_id,
      items: params.items,
      amount: params.amount,
      currency: params.currency,
      first_name: params.first_name,
      last_name: params.last_name,
      email: params.email,
      phone: params.phone,
      address: params.address,
      city: params.city,
      country: params.country,
    };

    console.log('[PayHere] starting payment with object:', paymentObject);
    console.log('[PayHere] native module present:', typeof PayHere?.startPayment === 'function');

    try {
      PayHere.startPayment(
        paymentObject,
        async () => {
          console.log('[PayHere] onCompleted fired');
          // PayHere confirmed completion client-side. Ask our server to
          // double-check directly with PayHere before we trust it (the IPN
          // webhook may also arrive separately and is handled idempotently).
          try {
            await verifyPayment({ orderId: params.order_id, taskId }).unwrap();
            await completeTaskApi(taskId).unwrap();
            toast({
              title: 'Payment successful',
              description: 'Task marked as completed and payment released.',
              variant: 'success',
            });
          } catch {
            toast({
              title: 'Payment received, confirming…',
              description: 'PayHere confirmed your payment - give it a moment and refresh if the status does not update.',
              variant: 'info',
            });
          } finally {
            router.back();
          }
        },
        (errorData: string) => {
          console.log('[PayHere] onError fired:', errorData);
          toast({
            title: 'Payment failed',
            description: typeof errorData === 'string' ? errorData : 'Please try again.',
            variant: 'error',
          });
          router.back();
        },
        () => {
          console.log('[PayHere] onDismissed fired');
          toast({
            title: 'Payment cancelled',
            description: 'You can try funding this job again anytime.',
            variant: 'info',
          });
          router.back();
        }
      );
    } catch (err: any) {
      // Thrown when the native module isn't linked, e.g. still running in
      // Expo Go instead of a prebuilt dev/production client - or any other
      // synchronous failure building/dispatching the request.
      console.error('[PayHere] startPayment threw synchronously:', err);
      toast({
        title: 'Payment unavailable',
        description: err?.message || 'Could not start the native payment module. Rebuild the app after running a native prebuild.',
        variant: 'error',
      });
      router.back();
    }
  }, [params, taskId]);

  if (!params || !taskId) {
    router.back();
    return null;
  }

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Secure payment" subtitle="PayHere" />
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0094F7" />
      </View>
    </Screen>
  );
}
