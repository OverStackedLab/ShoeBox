/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { ReceiptDetailScreen } from "@/screens/ReceiptDetailScreen"
import { SignUpScreen } from "@/screens/SignUpScreen"
import { UpdatePasswordScreen } from "@/screens/UpdatePasswordScreen"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { useAppTheme } from "@/theme/context"

import { TabNavigator } from "./TabNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated, isLoading, isRecovering } = useAuth()

  const {
    theme: { colors },
  } = useAppTheme()

  if (isLoading) return null

  const initialRouteName = isRecovering ? "UpdatePassword" : isAuthenticated ? "Tabs" : "Login"

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={initialRouteName}
    >
      {isRecovering ? (
        <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
      ) : isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />

          <Stack.Screen name="Tabs" component={TabNavigator} />

          <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
