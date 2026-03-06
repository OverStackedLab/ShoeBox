import { FC, useCallback } from "react"
import { LayoutAnimation, TextStyle, View, ViewStyle } from "react-native"
import * as Application from "expo-application"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ProfileScreenProps extends DemoTabScreenProps<"DemoDebug"> {}

export const ProfileScreen: FC<ProfileScreenProps> = function ProfileScreen() {
  const {
    themed,
    theme: { colors },
    setThemeContextOverride,
    themeContext,
  } = useAppTheme()
  const { authEmail, logout } = useAuth()
  const { currency, setCurrency } = useSettings()

  const themeLabel =
    themeContext === "light" ? "Light" : themeContext === "dark" ? "Dark" : "System"

  const cycleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (themeContext === undefined) {
      setThemeContextOverride("light")
    } else if (themeContext === "light") {
      setThemeContextOverride("dark")
    } else {
      setThemeContextOverride(undefined)
    }
  }, [themeContext, setThemeContextOverride])

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <Header title="Profile" titleMode="flex" safeAreaEdges={[]} />

      {/* User Info */}
      <Card
        style={[themed($card), themed($userInfoCard)]}
        ContentComponent={
          <View style={$userInfo}>
            <View style={$avatar}>
              <MaterialCommunityIcons name="account" size={90} color="#FFFFFF" />
            </View>
            {authEmail ? (
              <Text text={authEmail} size="sm" style={themed($email)} />
            ) : (
              <View style={$noEmailRow}>
                <Text text="email@domain.com" size="sm" style={themed($email)} />
              </View>
            )}
          </View>
        }
      />

      {/* Settings */}
      <Text text="Settings" size="sm" weight="bold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($card)}
        ContentComponent={
          <>
            <ListItem
              text="Theme"
              bottomSeparator
              onPress={cycleTheme}
              RightComponent={
                <View style={$rightRow}>
                  <Text text={themeLabel} size="sm" style={themed($rightText)} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
                </View>
              }
            />
            <ListItem
              text="Currency"
              onPress={() => setCurrency(currency === "USD" ? "HUF" : "USD")}
              RightComponent={
                <View style={$rightRow}>
                  <Text
                    text={currency === "USD" ? "USD ($)" : "HUF (Ft)"}
                    size="sm"
                    style={themed($rightText)}
                  />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
                </View>
              }
            />
          </>
        }
      />

      {/* App Info */}
      <Text text="App Info" size="sm" weight="semiBold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($card)}
        ContentComponent={
          <>
            <ListItem
              text="Version"
              bottomSeparator
              RightComponent={
                <Text
                  text={Application.nativeApplicationVersion ?? "—"}
                  size="sm"
                  style={themed($rightText)}
                />
              }
            />
            <ListItem
              text="Build"
              RightComponent={
                <Text
                  text={Application.nativeBuildVersion ?? "—"}
                  size="sm"
                  style={themed($rightText)}
                />
              }
            />
          </>
        }
      />

      {/* Account */}
      <Text text="Account" size="sm" weight="semiBold" uppercase style={themed($sectionHeading)} />
      <Button
        preset="filled"
        text="Sign Out"
        onPress={logout}
        style={$signOutButton}
        textStyle={$signOutText}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  marginBottom: spacing.xs,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $userInfo: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
  gap: 12,
}

const $avatar: ViewStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E8981E",
}

const $email: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $rightRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  gap: 4,
}

const $rightText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  alignSelf: "center",
})

const $userInfoCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 0,
  backgroundColor: colors.background,
})

const $noEmailRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $signOutButton: ViewStyle = {
  borderRadius: 8,
  backgroundColor: "#E8981E",
}

const $signOutText: TextStyle = {
  color: "#FFFFFF",
}

const $sectionHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.lg,
  marginBottom: spacing.xs,
  marginLeft: spacing.xs,
})
