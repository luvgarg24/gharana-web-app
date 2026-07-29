import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { View, Text, StyleSheet } from 'react-native';
import { useCart } from '@/src/context/CartContext';
import { colors } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.earth,
        tabBarInactiveTintColor: colors.dust,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 68,
        },
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.6, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <CartTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const { itemCount } = useCart();
  return (
    <View>
      <Feather name="shopping-bag" color={color} size={size} />
      {itemCount > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{itemCount}</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -6, right: -10, backgroundColor: colors.saffron,
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
