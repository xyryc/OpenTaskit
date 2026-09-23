import React, { useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import type { InitiateCheckoutResponse } from '@/types';

// PayHere's Hosted Checkout expects a real HTML form POST (not a GET link),
// so this builds a tiny self-submitting form and loads it in a WebView.
function buildCheckoutHtml(params: InitiateCheckoutResponse): string {
  const fields = Object.entries(params)
    .filter(([key]) => key !== 'checkoutUrl')
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`
    )
    .join('\n');

  return `
    <html>
      <body onload="document.forms[0].submit()">
        <form action="${params.checkoutUrl}" method="post">
          ${fields}
        </form>
      </body>
    </html>
  `;
}

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const { toast } = useApp();
  const { checkoutParams } = useLocalSearchParams<{ checkoutParams: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const settled = useRef(false);

  const params: InitiateCheckoutResponse | null = useMemo(() => {
    try {
      return checkoutParams ? JSON.parse(checkoutParams) : null;
    } catch {
      return null;
    }
  }, [checkoutParams]);

  const html = useMemo(() => (params ? buildCheckoutHtml(params) : ''), [params]);

  if (!params) {
    router.back();
    return null;
  }

  const handleNavigationChange = (navState: { url: string }) => {
    if (settled.current) return;

    if (navState.url.startsWith(params.return_url)) {
      settled.current = true;
      toast({
        title: 'Payment submitted',
        description: 'We are confirming your payment with PayHere. This can take a few seconds.',
        variant: 'success',
      });
      router.back();
    } else if (navState.url.startsWith(params.cancel_url)) {
      settled.current = true;
      toast({
        title: 'Payment cancelled',
        description: 'You can try funding this job again anytime.',
        variant: 'info',
      });
      router.back();
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Secure payment" subtitle="PayHere" />

      <View className="flex-1">
        {isLoading && (
          <View className="absolute inset-0 z-10 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#0094F7" />
          </View>
        )}
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationChange}
        />
      </View>
    </Screen>
  );
}
