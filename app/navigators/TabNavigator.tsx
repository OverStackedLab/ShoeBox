import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon } from "@/components/Icon"
import { AnalyticsScreen } from "@/screens/AnalyticsScreen"
import { HomeScreen } from "@/screens/HomeScreen"
import { ProfileScreen } from "@/screens/ProfileScreen"
import { ReceiptsScreen } from "@/screens/ReceiptsScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { TabParamList } from "./navigationTypes"

const logo = require("@assets/images/logo.png")

const Tab = createBottomTabNavigator<TabParamList>()

/**
 * Main bottom tab navigator.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `TabNavigator`.
 */
export function TabNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const screenHeaderOptions = {
    headerShown: true,
    headerTitleAlign: "center" as const,
    headerTitle: () => <Image source={logo} style={$headerLogo} resizeMode="contain" />,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.text,
    headerRight: () => (
      <View style={$headerRight}>
        <Icon icon="bell" color={colors.text} size={24} />
      </View>
    ),
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeaderOptions,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: "#90c853",
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="home"
              color={focused ? "#90c853" : colors.tintInactive}
              size={30}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          tabBarLabel: "Receipts",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="receipt-text-outline"
              color={focused ? "#90c853" : colors.tintInactive}
              size={30}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarAccessibilityLabel: "Analytics",
          tabBarLabel: "Analytics",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="google-analytics"
              color={focused ? "#90c853" : colors.tintInactive}
              size={30}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="account"
              color={focused ? "#90c853" : colors.tintInactive}
              size={30}
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})

const $headerLogo: ImageStyle = {
  width: 180,
  height: 54,
}

const $headerRight: ViewStyle = {
  paddingRight: 16,
}
