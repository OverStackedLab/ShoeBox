import { ComponentRef, ComponentType, FC, useMemo, useRef, useState } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const logo = require("@assets/images/logo.png")

const logoSource = Image.resolveAssetSource(logo)
const LOGO_ASPECT_RATIO = logoSource.width / logoSource.height

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

export const SignUpScreen: FC<SignUpScreenProps> = ({ navigation }) => {
  const passwordInput = useRef<ComponentRef<typeof TextField>>(null)
  const confirmPasswordInput = useRef<ComponentRef<typeof TextField>>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const { signUp } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const emailError = isSubmitted ? validateEmail(email) : ""
  const passwordError = isSubmitted ? validatePassword(password) : ""
  const confirmPasswordError = isSubmitted ? validateConfirmPassword(password, confirmPassword) : ""

  async function handleSignUp() {
    setIsSubmitted(true)
    if (
      validateEmail(email) ||
      validatePassword(password) ||
      validateConfirmPassword(password, confirmPassword)
    )
      return

    setIsLoading(true)
    setServerError("")
    const error = await signUp(email, password)
    setIsLoading(false)

    if (error) {
      setServerError(error)
      return
    }

    setSuccessMessage("Check your email to confirm your account.")
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
        <Text tx="signUpScreen:signUp" preset="heading" style={themed($heading)} />
        <Text text={successMessage} preset="subheading" style={themed($subheading)} />
        <Button
          tx="signUpScreen:logIn"
          preset="primary"
          style={themed($tapButton)}
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
      <Text tx="signUpScreen:signUp" preset="heading" style={themed($heading)} />
      <Text tx="signUpScreen:enterDetails" preset="subheading" style={themed($subheading)} />

      {!!serverError && <Text text={serverError} size="sm" style={themed($serverError)} />}

      <TextField
        value={email}
        onChangeText={setEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="signUpScreen:emailFieldLabel"
        placeholderTx="signUpScreen:emailFieldPlaceholder"
        helper={emailError}
        status={emailError ? "error" : undefined}
        onSubmitEditing={() => passwordInput.current?.focus()}
      />

      <TextField
        ref={passwordInput}
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        labelTx="signUpScreen:passwordFieldLabel"
        placeholderTx="signUpScreen:passwordFieldPlaceholder"
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
        labelTx="signUpScreen:confirmPasswordFieldLabel"
        placeholderTx="signUpScreen:confirmPasswordFieldPlaceholder"
        helper={confirmPasswordError}
        status={confirmPasswordError ? "error" : undefined}
        onSubmitEditing={handleSignUp}
        RightAccessory={ConfirmPasswordRightAccessory}
      />

      <Button
        tx="signUpScreen:tapToSignUp"
        style={themed($tapButton)}
        preset="primary"
        onPress={handleSignUp}
        disabled={isLoading}
      />

      <Button
        tx="signUpScreen:alreadyHaveAccount"
        preset="default"
        style={themed($loginButton)}
        onPress={() => navigation.navigate("Login")}
      />
    </Screen>
  )
}

function validateEmail(email: string): string {
  if (!email || email.length === 0) return "can't be blank"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "must be a valid email address"
  return ""
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
  marginVertical: spacing.lg,
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

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $loginButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
