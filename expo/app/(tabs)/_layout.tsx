import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Trophy, ShoppingBag, Settings, Shield, LayoutGrid, BookOpen, Database } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export default function TabLayout() {
  const appContext = useApp();
  
  if (!appContext || !appContext.theme) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }
  
  const { theme, t, user } = appContext;
  const isAdmin = user?.role === 'ADMIN';
  const isConfig = user?.role === 'CONFIG';
  const isPlayer = user?.role === 'PLAYER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.matches,
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
          href: isConfig ? null : '/',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t.nav.leaderboard,
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
          href: isPlayer ? '/leaderboard' : null,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t.nav.shop,
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          href: isPlayer ? '/shop' : null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t.nav.admin,
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
          href: isAdmin ? '/admin' : null,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: t.nav.rules,
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
          href: isConfig ? null : '/rules',
        }}
      />
      <Tabs.Screen
        name="dbconfig"
        options={{
          title: t.nav.dbConfig,
          tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
          href: isConfig ? '/dbconfig' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.nav.settings,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          href: isConfig ? null : '/settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
