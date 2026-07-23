import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import type { ColorValue } from 'react-native';

const tabIcons = {
  dashboard: ['home-outline', 'home'],
  map: ['map-outline', 'map'],
  complaints: ['document-text-outline', 'document-text'],
  analytics: ['bar-chart-outline', 'bar-chart'],
  feedback: ['chatbox-ellipses-outline', 'chatbox-ellipses'],
} as const;

function TabIcon({
  route,
  focused,
  color,
}: {
  route: keyof typeof tabIcons;
  focused: boolean;
  color: ColorValue;
}) {
  const [inactiveIcon, activeIcon] = tabIcons[route];
  return (
    <Ionicons
      name={focused ? activeIcon : inactiveIcon}
      size={22}
      color={color}
    />
  );
}

export default function AuthorityTabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#23435D',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          minHeight: 50,
          paddingVertical: 3,
        },
        tabBarStyle: {
          minHeight: 64,
          paddingHorizontal: 4,
          paddingTop: 7,
          paddingBottom: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#ECECEC',
        },
        sceneStyle: {
          backgroundColor: '#F7F8FA',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon route="dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon route="map" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.navigate({
              pathname: '/authority/complaints',
              params: { status: '', category: '', area: '', query: '' },
            } as never);
          },
        }}
        options={{
          title: 'Complaints',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon route="complaints" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon route="analytics" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feedback-center"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon route="feedback" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
