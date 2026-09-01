import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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

const TAB_KEYS = ['home', 'discover', 'activity', 'profile'];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, unreadNotifications, pendingOfferCount, unreadMessages, requireAccount } = useApp();

  const currentRouteName = state.routes[state.index]?.name || 'home';
  const activeIndex = Math.max(0, TAB_KEYS.indexOf(currentRouteName));

  const [tabCenters, setTabCenters] = useState<{ [key: number]: number }>({});
  const translateX = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  const handleTabLayout = (index: number, e: any) => {
    const { x, width } = e.nativeEvent.layout;
    const centerX = x + width / 2;
    setTabCenters((prev) => ({ ...prev, [index]: centerX }));
  };

  useEffect(() => {
    const targetX = tabCenters[activeIndex];
    if (targetX !== undefined) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX - 2.5, // Center the 5px dot
          useNativeDriver: true,
          tension: 70,
          friction: 10,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeIndex, tabCenters]);

  return (
    <View
      className="border-t border-ink-200/70 bg-white px-2 pt-1.5"
      style={{ paddingBottom: Math.max(insets.bottom, 8) + 4 }}
    >
      <View className="relative flex-row items-center justify-between">
        {/* Tab 1: Home */}
        <Pressable
          onLayout={(e) => handleTabLayout(0, e)}
          onPress={() => navigation.navigate('home')}
          className="h-[58px] w-[70px] items-center justify-center gap-1"
        >
          <HomeIcon
            size={22}
            color={currentRouteName === 'home' ? '#0094F7' : '#8A959B'}
          />
          <Text
            className={`text-[10.5px] font-geist-semibold font-semibold ${
              currentRouteName === 'home' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.home') || 'Home'}
          </Text>
        </Pressable>

        {/* Tab 2: Discover */}
        <Pressable
          onLayout={(e) => handleTabLayout(1, e)}
          onPress={() => navigation.navigate('discover')}
          className="h-[58px] w-[70px] items-center justify-center gap-1"
        >
          <Compass
            size={22}
            color={currentRouteName === 'discover' ? '#0094F7' : '#8A959B'}
          />
          <Text
            className={`text-[10.5px] font-geist-semibold font-semibold ${
              currentRouteName === 'discover' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.discover') || 'Discover'}
          </Text>
        </Pressable>

        {/* Center Plus Button (Exact 56x56px rounded-22px from Web App, Contained in Tab Bar) */}
        <View className="h-[58px] w-[74px] items-center justify-center">
          <Pressable
            onPress={() => {
              if (!requireAccount('post')) return;
              router.push('/create' as any);
            }}
            className="h-[56px] w-[56px] items-center justify-center rounded-[22px] bg-brand active:scale-95"
            style={{
              elevation: 4,
              shadowColor: '#0094F7',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.28,
              shadowRadius: 6,
            }}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Tab 3: Activity */}
        <Pressable
          onLayout={(e) => handleTabLayout(2, e)}
          onPress={() => navigation.navigate('activity')}
          className="h-[58px] w-[70px] items-center justify-center gap-1"
        >
          <View className="relative">
            <Receipt
              size={22}
              color={currentRouteName === 'activity' ? '#0094F7' : '#8A959B'}
            />
            {pendingOfferCount > 0 && (
              <View className="absolute -right-2.5 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1">
                <Text className="text-[10px] font-geist-bold font-bold text-white">
                  {pendingOfferCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`text-[10.5px] font-geist-semibold font-semibold ${
              currentRouteName === 'activity' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.activity') || 'Activity'}
          </Text>
        </Pressable>

        {/* Tab 4: Profile */}
        <Pressable
          onLayout={(e) => handleTabLayout(3, e)}
          onPress={() => navigation.navigate('profile')}
          className="h-[58px] w-[70px] items-center justify-center gap-1"
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
            className={`text-[10.5px] font-geist-semibold font-semibold ${
              currentRouteName === 'profile' ? 'text-brand' : 'text-ink-400'
            }`}
          >
            {t('nav.profile') || 'Profile'}
          </Text>
        </Pressable>

        {/* Smooth Sliding Animated Indicator Dot */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: '#0094F7',
            opacity: dotOpacity,
            transform: [{ translateX }],
          }}
        />
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
