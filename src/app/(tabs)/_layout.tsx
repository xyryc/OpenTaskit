import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Compass,
  Home as HomeIcon,
  Plus,
  Receipt,
  User as UserIcon,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, unreadNotifications, pendingOfferCount, unreadMessages, requireAccount } = useApp();

  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-ink-200/70 bg-white px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row items-end justify-between">
        {/* Tab 1: Home */}
        <Pressable
          onPress={() => navigation.navigate('home')}
          className="w-[72px] items-center gap-1 py-1.5"
        >
          <HomeIcon
            size={22}
            color={currentRouteName === 'home' ? '#0094F7' : '#8A959B'}
          />
          <Text
            className={`text-[10.5px] font-semibold ${
              currentRouteName === 'home' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.home') || 'Home'}
          </Text>
          {currentRouteName === 'home' && (
            <View className="h-1 w-1 rounded-full bg-brand" />
          )}
        </Pressable>

        {/* Tab 2: Discover */}
        <Pressable
          onPress={() => navigation.navigate('discover')}
          className="w-[72px] items-center gap-1 py-1.5"
        >
          <Compass
            size={22}
            color={currentRouteName === 'discover' ? '#0094F7' : '#8A959B'}
          />
          <Text
            className={`text-[10.5px] font-semibold ${
              currentRouteName === 'discover' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.discover') || 'Discover'}
          </Text>
          {currentRouteName === 'discover' && (
            <View className="h-1 w-1 rounded-full bg-brand" />
          )}
        </Pressable>

        {/* Center Floating Plus Button */}
        <View className="relative -mt-7 w-[68px] items-center justify-center">
          <Pressable
            onPress={() => {
              if (!requireAccount('post')) return;
              router.push('/create' as any);
            }}
            className="h-[54px] w-[54px] items-center justify-center rounded-[22px] bg-brand shadow-lg active:scale-95"
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Tab 3: Activity */}
        <Pressable
          onPress={() => navigation.navigate('activity')}
          className="w-[72px] items-center gap-1 py-1.5"
        >
          <View className="relative">
            <Receipt
              size={22}
              color={currentRouteName === 'activity' ? '#0094F7' : '#8A959B'}
            />
            {pendingOfferCount > 0 && (
              <View className="absolute -right-2.5 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1">
                <Text className="text-[10px] font-bold text-white">
                  {pendingOfferCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`text-[10.5px] font-semibold ${
              currentRouteName === 'activity' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.activity') || 'Activity'}
          </Text>
          {currentRouteName === 'activity' && (
            <View className="h-1 w-1 rounded-full bg-brand" />
          )}
        </Pressable>

        {/* Tab 4: Profile */}
        <Pressable
          onPress={() => navigation.navigate('profile')}
          className="w-[72px] items-center gap-1 py-1.5"
        >
          <View className="relative">
            <UserIcon
              size={22}
              color={currentRouteName === 'profile' ? '#0094F7' : '#8A959B'}
            />
            {(unreadNotifications > 0 || unreadMessages > 0) && (
              <View className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </View>
          <Text
            className={`text-[10.5px] font-semibold ${
              currentRouteName === 'profile' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.profile') || 'Profile'}
          </Text>
          {currentRouteName === 'profile' && (
            <View className="h-1 w-1 rounded-full bg-brand" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
