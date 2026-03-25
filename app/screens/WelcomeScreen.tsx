import { FC } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"

const welcomeLogo = require("@assets/images/logo.png")

interface WelcomeScreenProps extends AppStackScreenProps<"Welcome"> {}

export const WelcomeScreen: FC<WelcomeScreenProps> = function WelcomeScreen(_props) {
  const { themed, theme } = useAppTheme()
  const { navigation } = _props

  function goNext() {
    navigation.navigate("Tabs", { screen: "Home", params: {} })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$styles.flex1}>
      <View style={themed($topContainer)}>
        <Image style={themed($welcomeLogo)} source={welcomeLogo} resizeMode="contain" />
        <Text
          testID="welcome-heading"
          tx="welcomeScreen:tagline"
          preset="heading"
          style={themed($heading)}
        />
        <Text tx="welcomeScreen:subtitle" preset="subheading" style={themed($subtitle)} />
      </View>

      <View style={themed($featureContainer)}>
        <View style={themed($featureRow)}>
          <View style={themed($featureIconContainer)}>
            <Icon icon="components" color={theme.colors.palette.neutral100} size={20} />
          </View>
          <Text tx="welcomeScreen:featureScan" size="sm" weight="medium" />
        </View>

        <View style={themed($featureRow)}>
          <View style={themed($featureIconContainer)}>
            <Icon icon="menu" color={theme.colors.palette.neutral100} size={20} />
          </View>
          <Text tx="welcomeScreen:featureOrganize" size="sm" weight="medium" />
        </View>

        <View style={themed($featureRow)}>
          <View style={themed($featureIconContainer)}>
            <Icon icon="check" color={theme.colors.palette.neutral100} size={20} />
          </View>
          <Text tx="welcomeScreen:featureInsights" size="sm" weight="medium" />
        </View>
      </View>

      <View style={themed($bottomContainer)}>
        <Button
          testID="next-screen-button"
          preset="reversed"
          tx="welcomeScreen:getStarted"
          onPress={goNext}
        />
      </View>
    </Screen>
  )
}

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xxxl,
})

const $welcomeLogo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 88,
  width: "100%",
  marginBottom: spacing.xl,
})

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.textDim,
})

const $featureContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xl,
  gap: spacing.md,
  paddingVertical: spacing.lg,
})

const $featureRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
})

const $featureIconContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.tint,
  justifyContent: "center",
  alignItems: "center",
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxxl,
  gap: spacing.md,
})
