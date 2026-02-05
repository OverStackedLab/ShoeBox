import { FC } from "react"
import { Pressable, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useHeader } from "@/utils/useHeader"

interface HomeScreenProps extends DemoTabScreenProps<"Home"> {}

// Mock data for recent expenses
const recentExpenses = [
  { id: "1", name: "Denorel Back", date: "19/09/2021", amount: -13.0 },
  { id: "2", name: "Tester", date: "12/09/2021", amount: -12.0 },
]

// Mock data for monthly spending chart
const monthlyData = [
  { month: "Jan", value: 2000 },
  { month: "Feb", value: 3500 },
  { month: "Mar", value: 5000 },
  { month: "Apr", value: 2500 },
  { month: "May", value: 7000 },
  { month: "Jun", value: 6000 },
  { month: "Jul", value: 4500 },
  { month: "Aug", value: 3000 },
  { month: "Sep", value: 5500 },
  { month: "Oct", value: 4000 },
  { month: "Nov", value: 6500 },
  { month: "Dec", value: 5000 },
]

const maxValue = Math.max(...monthlyData.map((d) => d.value))

export const HomeScreen: FC<HomeScreenProps> = function HomeScreen(_props) {
  const { themed, theme } = useAppTheme()

  useHeader({
    title: "Home",
    titleMode: "flex",
    RightActionComponent: (
      <TouchableOpacity onPress={() => console.log("notifications")} style={$notificationButton}>
        <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    ),
  })

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)}>
      {/* Scan Receipt Button */}
      <View style={$scanButtonContainer}>
        <Pressable style={[themed($scanButton), { backgroundColor: theme.colors.tint }]}>
          <Ionicons name="scan-outline" size={84} color="#FFFFFF" />
          <Text
            preset="subheading"
            size="lg"
            weight="semiBold"
            style={{ color: theme.colors.background }}
          >
            Scan Receipt
          </Text>
        </Pressable>
      </View>

      {/* Recent Expenses Section */}
      <View style={themed($sectionContainer)}>
        <View style={$sectionHeader}>
          <Text preset="subheading" size="lg" weight="semiBold">
            Recent Expenses
          </Text>
          <Pressable>
            <Text
              preset="subheading"
              size="sm"
              weight="medium"
              style={{ color: theme.colors.tint }}
            >
              See All
            </Text>
          </Pressable>
        </View>

        {recentExpenses.map((expense) => (
          <View key={expense.id} style={themed($expenseItem)}>
            <View style={[themed($expenseIcon), { backgroundColor: theme.colors.tint + "20" }]}>
              <Ionicons name="receipt-outline" size={20} color={theme.colors.tint} />
            </View>
            <View style={$expenseDetails}>
              <Text size="sm" weight="medium">
                {expense.name}
              </Text>
              <Text size="xs" weight="normal" style={themed($expenseDate)}>
                {expense.date}
              </Text>
            </View>
            <Text size="sm" weight="semiBold">
              -${Math.abs(expense.amount).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Spending Section */}
      <View style={themed($sectionContainer)}>
        <Text preset="subheading" size="lg" weight="semiBold">
          Monthly Spending
        </Text>

        {/* Y-axis labels and chart */}
        <View style={$chartContainer}>
          <View style={$yAxisLabels}>
            <Text size="xxs" style={themed($axisLabel)}>
              $7000
            </Text>
            <Text size="xxs" style={themed($axisLabel)}>
              $5000
            </Text>
            <Text size="xxs" style={themed($axisLabel)}>
              $2000
            </Text>
          </View>

          <View style={$chartArea}>
            <View style={$barsContainer}>
              {monthlyData.map((item) => (
                <View key={item.month} style={$barWrapper}>
                  <View
                    style={[
                      $bar,
                      {
                        height: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: theme.colors.tint,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
})

const $notificationButton: ViewStyle = {
  paddingHorizontal: 16,
  justifyContent: "center",
  height: "100%",
}

const $scanButtonContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 32,
}

const $scanButton: ThemedStyle<ViewStyle> = () => ({
  width: 220,
  height: 220,
  borderRadius: 110,
  justifyContent: "center",
  alignItems: "center",
})

const $sectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
}

const $expenseItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
})

const $expenseIcon: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
})

const $expenseDetails: ViewStyle = {
  flex: 1,
  marginLeft: 12,
}

const $expenseDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

const $chartContainer: ViewStyle = {
  flexDirection: "row",
  height: 160,
  marginTop: 16,
}

const $yAxisLabels: ViewStyle = {
  width: 50,
  justifyContent: "space-between",
  paddingVertical: 4,
}

const $axisLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $chartArea: ViewStyle = {
  flex: 1,
}

const $barsContainer: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "space-between",
  paddingHorizontal: 4,
}

const $barWrapper: ViewStyle = {
  flex: 1,
  height: "100%",
  justifyContent: "flex-end",
  alignItems: "center",
  paddingHorizontal: 2,
}

const $bar: ViewStyle = {
  width: "80%",
  borderRadius: 4,
  minHeight: 4,
}
