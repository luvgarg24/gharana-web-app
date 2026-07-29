import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, View } from 'react-native';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { colors } from '@/src/theme/tokens';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[slug]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="category/[slug]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="order/[id]" options={{ animation: 'fade' }} />
      <Stack.Screen name="orders" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscriptions" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="referrals" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <CartProvider>
            <AuthGate />
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
