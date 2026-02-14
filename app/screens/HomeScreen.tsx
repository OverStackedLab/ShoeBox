import { FC } from "react"
import { Dimensions, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { BarChart } from "react-native-chart-kit"

import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const SCREEN_PADDING = 24
const CHART_WIDTH = Dimensions.get("window").width - SCREEN_PADDING * 2
const ACCENT_ORANGE = "#E8981E"
const SCAN_BUTTON_SIZE = 120

interface ExpenseItem {
  id: string
  name: string
  date: string
  amount: number
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor: string
}

const recentExpenses: ExpenseItem[] = [
  {
    id: "1",
    name: "Denorel Back",
    date: "10/06/2021",
    amount: -13.0,
    icon: "credit-card-outline",
    iconColor: "#E8981E",
  },
  {
    id: "2",
    name: "Tester",
    date: "12/06/2021",
    amount: -12.0,
    icon: "clipboard-text-outline",
    iconColor: "#E8981E",
  },
]

const monthlySpendingData = {
  labels: ["", "", "", "", "", "", "", "", "", "", "", ""],
  datasets: [
    {
      data: [500, 2200, 800, 5200, 8500, 7800, 5500, 3200, 6800, 7200, 5800, 6500],
    },
  ],
}

interface HomeScreenProps extends DemoTabScreenProps<"DemoShowroom"> {}

export const HomeScreen: FC<HomeScreenProps> = function HomeScreen() {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($screenContainer)}
    >
      {/* Header */}
      <Header
        title="Home"
        titleMode="flex"
        titleStyle={$headerTitle}
        safeAreaEdges={[]}
        rightIcon="bell"
        rightIconColor={colors.text}
      />

      {/* Scan Receipt */}
      <Card
        style={themed($scanCard)}
        ContentComponent={
          <View style={$scanCardContent}>
            <View style={themed($scanButtonRing)}>
              <TouchableOpacity style={$scanButton} activeOpacity={0.8}>
                <MaterialCommunityIcons name="qrcode-scan" size={40} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text text="Scan Receipt" weight="medium" size="sm" style={themed($scanLabel)} />
          </View>
        }
      />

      {/* Recent Expenses */}
      <Card
        style={themed($cardBase)}
        HeadingComponent={
          <View style={$cardHeaderRow}>
            <Text text="Recent Expenses" weight="bold" size="md" />
            <TouchableOpacity>
              <Text text="See All" size="xs" style={themed($seeAllText)} />
            </TouchableOpacity>
          </View>
        }
        ContentComponent={
          <View>
            {recentExpenses.map((expense, index) => (
              <ListItem
                key={expense.id}
                height={64}
                bottomSeparator={index < recentExpenses.length - 1}
                LeftComponent={
                  <View style={$expenseLeftRow}>
                    <View
                      style={[$expenseIconWrapper, { backgroundColor: expense.iconColor + "20" }]}
                    >
                      <MaterialCommunityIcons
                        name={expense.icon}
                        size={20}
                        color={expense.iconColor}
                      />
                    </View>
                    <View>
                      <Text text={expense.name} size="sm" weight="medium" />
                      <Text text={expense.date} size="xxs" style={themed($expenseDate)} />
                    </View>
                  </View>
                }
                RightComponent={
                  <Text
                    text={`-$${Math.abs(expense.amount).toFixed(2)}`}
                    weight="bold"
                    size="sm"
                    style={$expenseAmount}
                  />
                }
              />
            ))}
          </View>
        }
      />

      {/* Monthly Spending */}
      <Card
        heading="Monthly Spending"
        style={themed($cardBase)}
        ContentComponent={
          <View style={$chartContainer}>
            <BarChart
              data={monthlySpendingData}
              width={CHART_WIDTH - 32}
              height={200}
              yAxisLabel="$"
              yAxisSuffix=""
              fromZero
              showBarTops={false}
              withInnerLines={false}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: colors.background,
                backgroundGradientFromOpacity: 0,
                backgroundGradientTo: colors.background,
                backgroundGradientToOpacity: 0,
                decimalPlaces: 0,
                color: () => ACCENT_ORANGE,
                labelColor: () => colors.textDim,
                barPercentage: 0.4,
                barRadius: 3,
                propsForBackgroundLines: {
                  strokeWidth: 0,
                },
              }}
              style={$chartStyle}
            />
          </View>
        }
      />
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $headerTitle: TextStyle = {
  fontSize: 28,
  lineHeight: 36,
  textAlign: "left",
}

const $scanCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: spacing.lg,
  marginBottom: spacing.md,
  alignItems: "center",
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $scanCardContent: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $scanButtonRing: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: SCAN_BUTTON_SIZE + 16,
  height: SCAN_BUTTON_SIZE + 16,
  borderRadius: (SCAN_BUTTON_SIZE + 16) / 2,
  borderWidth: 3,
  borderColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
})

const $scanButton: ViewStyle = {
  width: SCAN_BUTTON_SIZE,
  height: SCAN_BUTTON_SIZE,
  borderRadius: SCAN_BUTTON_SIZE / 2,
  backgroundColor: ACCENT_ORANGE,
  alignItems: "center",
  justifyContent: "center",
}

const $scanLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $cardBase: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.md,
  marginBottom: spacing.md,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $cardHeaderRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
}

const $seeAllText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $expenseLeftRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $expenseIconWrapper: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  marginEnd: 12,
}

const $expenseDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $expenseAmount: TextStyle = {
  alignSelf: "center",
  fontVariant: ["tabular-nums"],
}

const $chartContainer: ViewStyle = {
  alignItems: "center",
  marginTop: 8,
}

const $chartStyle: ViewStyle = {
  borderRadius: 8,
}
