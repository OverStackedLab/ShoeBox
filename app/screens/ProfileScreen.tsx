import { FC, useCallback } from "react"
import { LayoutAnimation, TextStyle, View, ViewStyle } from "react-native"
import * as Application from "expo-application"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
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
      <Card
        heading="Settings"
        style={themed($card)}
        ContentComponent={
          <ListItem
            text="Theme"
            onPress={cycleTheme}
            RightComponent={
              <View style={$rightRow}>
                <Text text={themeLabel} size="sm" style={themed($rightText)} />
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
              </View>
            }
          />
        }
      />

      {/* Account */}
      <Card
        heading="Account"
        style={themed($card)}
        ContentComponent={
          <ListItem
            text="Sign Out"
            textStyle={$signOutText}
            onPress={logout}
            LeftComponent={
              <MaterialCommunityIcons
                name="door-open"
                size={20}
                color={colors.error}
                style={$leftIcon}
              />
            }
          />
        }
      />

      {/* App Info */}
      <Card
        heading="App Info"
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
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.md,
  marginBottom: spacing.md,
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
})

const $signOutText: TextStyle = {
  color: "#E8340A",
}

const $userInfoCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 0,
  backgroundColor: colors.background,
})

const $noEmailRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $leftIcon: ViewStyle = {
  alignSelf: "center",
  marginEnd: 12,
}
