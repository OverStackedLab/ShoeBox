import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Image, ImageStyle, TextInput, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const logo = require("@assets/images/logo.png")

const logoSource = Image.resolveAssetSource(logo)
const LOGO_ASPECT_RATIO = logoSource.width / logoSource.height

export const UpdatePasswordScreen: FC = () => {
  const confirmPasswordInput = useRef<TextInput>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const { updatePassword, clearRecovery, logout } = useAuth()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const passwordError = isSubmitted ? validatePassword(password) : ""
  const confirmPasswordError = isSubmitted ? validateConfirmPassword(password, confirmPassword) : ""

  async function handleUpdate() {
    setIsSubmitted(true)
    if (validatePassword(password) || validateConfirmPassword(password, confirmPassword)) return

    setIsLoading(true)
    setServerError("")
    const error = await updatePassword(password)
    setIsLoading(false)

    if (error) {
      setServerError(error)
      return
    }

    setSuccessMessage("Your password has been updated.")
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          />
        )
      },
    [isPasswordHidden, colors.palette.neutral800],
  )

  const ConfirmPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function ConfirmPasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isConfirmPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
          />
        )
      },
    [isConfirmPasswordHidden, colors.palette.neutral800],
  )

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
        <Text tx="updatePasswordScreen:heading" preset="heading" style={themed($heading)} />
        <Text text={successMessage} preset="subheading" style={themed($subheading)} />
        <Button
          tx="signUpScreen:logIn"
          preset="primary"
          style={themed($primaryButton)}
          onPress={() => {
            clearRecovery()
            logout()
          }}
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
      <Text tx="updatePasswordScreen:heading" preset="heading" style={themed($heading)} />
      <Text
        tx="updatePasswordScreen:enterDetails"
        preset="subheading"
        style={themed($subheading)}
      />

      {!!serverError && <Text text={serverError} size="sm" style={themed($serverError)} />}

      <TextField
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        labelTx="updatePasswordScreen:passwordFieldLabel"
        placeholderTx="updatePasswordScreen:passwordFieldPlaceholder"
        helper={passwordError}
        status={passwordError ? "error" : undefined}
        onSubmitEditing={() => confirmPasswordInput.current?.focus()}
        RightAccessory={PasswordRightAccessory}
      />

      <TextField
        ref={confirmPasswordInput}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        secureTextEntry={isConfirmPasswordHidden}
        labelTx="updatePasswordScreen:confirmPasswordFieldLabel"
        placeholderTx="updatePasswordScreen:confirmPasswordFieldPlaceholder"
        helper={confirmPasswordError}
        status={confirmPasswordError ? "error" : undefined}
        onSubmitEditing={handleUpdate}
        RightAccessory={ConfirmPasswordRightAccessory}
      />

      <Button
        tx="updatePasswordScreen:updatePassword"
        preset="primary"
        style={themed($primaryButton)}
        onPress={handleUpdate}
        disabled={isLoading}
      />
    </Screen>
  )
}

function validatePassword(password: string): string {
  if (!password || password.length === 0) return "can't be blank"
  if (password.length < 6) return "must be at least 6 characters"
  return ""
}

function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (!confirmPassword || confirmPassword.length === 0) return "can't be blank"
  if (password !== confirmPassword) return "passwords do not match"
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
