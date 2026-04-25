import { ComponentRef, ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
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

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = function LoginScreen({ navigation }) {
  const authPasswordInput = useRef<ComponentRef<typeof TextField>>(null)

  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const { signIn } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    // Pre-fill credentials in dev builds only.
    if (__DEV__) {
      setAuthEmail("test@overstacked.dev")
      setAuthPassword("Test123")
    }
  }, [])

  const emailError = isSubmitted ? validateEmail(authEmail) : ""

  async function handleLogin() {
    if (isLoading) return
    setIsSubmitted(true)
    if (validateEmail(authEmail)) return

    setIsLoading(true)
    setServerError("")
    const error = await signIn(authEmail, authPassword)
    setIsLoading(false)

    if (error) {
      setServerError(error)
      return
    }

    setAuthPassword("")
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.text}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.text],
  )

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={themed($screenContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($logoSlot)}>
        <Image source={logo} style={$logo} resizeMode="contain" />
      </View>

      <View style={$formSlot}>
        {!!serverError && <Text text={serverError} size="sm" style={themed($serverError)} />}

        <TextField
          value={authEmail}
          onChangeText={setAuthEmail}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          labelTx="loginScreen:emailFieldLabel"
          placeholderTx="loginScreen:emailFieldPlaceholder"
          helper={emailError}
          status={emailError ? "error" : undefined}
          onSubmitEditing={() => authPasswordInput.current?.focus()}
        />

        <TextField
          ref={authPasswordInput}
          value={authPassword}
          onChangeText={setAuthPassword}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={isAuthPasswordHidden}
          labelTx="loginScreen:passwordFieldLabel"
          placeholderTx="loginScreen:passwordFieldPlaceholder"
          onSubmitEditing={handleLogin}
          RightAccessory={PasswordRightAccessory}
        />

        <Button
          testID="login-button"
          tx="loginScreen:tapToLogIn"
          style={themed($tapButton)}
          preset="primary"
          onPress={handleLogin}
          disabled={isLoading}
        />

        <Button
          tx="loginScreen:createAccount"
          preset="default"
          style={themed($createAccountButton)}
          onPress={() => navigation.navigate("SignUp")}
        />

        <Button
          tx="loginScreen:forgotPassword"
          preset="link"
          style={themed($forgotPasswordButton)}
          onPress={() => navigation.navigate("ForgotPassword")}
        />
      </View>
    </Screen>
  )
}

function validateEmail(email: string): string {
  if (!email || email.length === 0) return "can't be blank"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "must be a valid email address"
  return ""
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingTop: 0,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $logoSlot: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 0.75,
  marginHorizontal: -spacing.lg,
  alignItems: "center",
  justifyContent: "center",
})

const $formSlot: ViewStyle = {
  flex: 1.25,
  justifyContent: "flex-start",
}

const $logo: ImageStyle = {
  width: "100%",
  height: undefined,
  aspectRatio: LOGO_ASPECT_RATIO,
}

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

const $createAccountButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $forgotPasswordButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
