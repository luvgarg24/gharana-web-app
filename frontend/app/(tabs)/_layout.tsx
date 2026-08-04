import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { View, Text, StyleSheet } from 'react-native';
import { useCart } from '@/src/context/CartContext';
import { colors, fonts } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.saffron,
        tabBarInactiveTintColor: colors.dust,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 7,
          height: 72,
          elevation: 8,
          shadowColor: '#111827',
          shadowOpacity: 0.07,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.bodySemibold, marginTop: 1 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Feather name="grid" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <CartTabIcon color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Feather name="user" color={color} size={21} />,
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
  badgeText: { color: colors.white, fontSize: 9, fontFamily: fonts.bodyBold },
});
