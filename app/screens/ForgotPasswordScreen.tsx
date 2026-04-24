import { FC, useState } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const logo = require("@assets/images/logo.png")

const logoSource = Image.resolveAssetSource(logo)
const LOGO_ASPECT_RATIO = logoSource.width / logoSource.height

interface ForgotPasswordScreenProps extends AppStackScreenProps<"ForgotPassword"> {}

export const ForgotPasswordScreen: FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const emailError = isSubmitted ? validateEmail(email) : ""

  async function handleSubmit() {
    setIsSubmitted(true)
    if (validateEmail(email)) return

    setIsLoading(true)
    setServerError("")
    const error = await resetPassword(email)
    setIsLoading(false)

    if (error) {
      setServerError(error)
      return
    }

    setSuccessMessage("Check your email for a link to reset your password.")
  }

  if (successMessage) {
    return (
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
      >
        <View style={themed($logoSlot)}>
          <Image source={logo} style={$logo} resizeMode="contain" />
        </View>
        <Text tx="forgotPasswordScreen:heading" preset="heading" style={themed($heading)} />
        <Text text={successMessage} preset="subheading" style={themed($subheading)} />
        <Button
          tx="forgotPasswordScreen:backToLogin"
          preset="primary"
          style={themed($primaryButton)}
          onPress={() => navigation.navigate("Login")}
        />
      </Screen>
    )
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($logoSlot)}>
        <Image source={logo} style={$logo} resizeMode="contain" />
      </View>
      <Text tx="forgotPasswordScreen:heading" preset="heading" style={themed($heading)} />
      <Text
        tx="forgotPasswordScreen:enterDetails"
        preset="subheading"
        style={themed($subheading)}
      />

      {!!serverError && <Text text={serverError} size="sm" style={themed($serverError)} />}

      <TextField
        value={email}
        onChangeText={setEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="forgotPasswordScreen:emailFieldLabel"
        placeholderTx="forgotPasswordScreen:emailFieldPlaceholder"
        helper={emailError}
        status={emailError ? "error" : undefined}
        onSubmitEditing={handleSubmit}
      />

      <Button
        tx="forgotPasswordScreen:sendResetLink"
        preset="primary"
        style={themed($primaryButton)}
        onPress={handleSubmit}
        disabled={isLoading}
      />

      <Button
        tx="forgotPasswordScreen:backToLogin"
        preset="default"
        style={themed($secondaryButton)}
        onPress={() => navigation.goBack()}
      />
    </Screen>
  )
}

function validateEmail(email: string): string {
  if (!email || email.length === 0) return "can't be blank"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "must be a valid email address"
  return ""
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: 0,
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $logoSlot: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: -spacing.lg,
  marginBottom: spacing.lg,
})

const $logo: ImageStyle = {
  width: "100%",
  height: undefined,
  aspectRatio: LOGO_ASPECT_RATIO,
}

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $subheading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $serverError: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $primaryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $secondaryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
