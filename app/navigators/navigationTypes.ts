import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Tab Navigator types
export type TabParamList = {
  Receipts: undefined
  Home: { queryIndex?: string; itemIndex?: string }
  Profile: undefined
  Analytics: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Welcome: undefined
  Login: undefined
  SignUp: undefined
  ForgotPassword: undefined
  UpdatePassword: undefined
  Tabs: NavigatorScreenParams<TabParamList>
  ReceiptDetail: {
    receiptId: string
    storeName?: string
    date?: string
    total?: number
    scannedImages?: Array<{ uri: string; width: number; height: number }>
  }
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
