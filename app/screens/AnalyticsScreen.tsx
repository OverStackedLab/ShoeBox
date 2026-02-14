import { FC } from "react"
import { Dimensions, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { PieChart } from "react-native-chart-kit"

import { Card } from "@/components/Card"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const CHART_SIZE = Dimensions.get("window").width - 16
const DONUT_HOLE = CHART_SIZE * 0.3

interface CategoryItem {
  name: string
  amount: number
  color: string
}

const categories: CategoryItem[] = [
  { name: "Category", amount: 12.0, color: "#E8981E" },
  { name: "Spending", amount: 10.0, color: "#F5B041" },
  { name: "Food", amount: 4.0, color: "#F0C060" },
  { name: "Business", amount: 2.0, color: "#D4780A" },
  { name: "Savings", amount: 3.0, color: "#90c853" },
  { name: "Others", amount: 1.0, color: "#C46A08" },
]

const chartData = categories.map((cat) => ({
  name: cat.name,
  population: cat.amount,
  color: cat.color,
  legendFontColor: "#999",
  legendFontSize: 0,
}))

interface AnalyticsScreenProps extends DemoTabScreenProps<"Analytics"> {}

export const AnalyticsScreen: FC<AnalyticsScreenProps> = function AnalyticsScreen() {
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($screenContainer)}
    >
      <Text preset="heading" style={themed($heading)} text="Analytics" />

      {/* Donut Chart */}
      <Card
        style={themed($chartCard)}
        ContentComponent={
          <View>
            <View style={$chartWrapper}>
              <PieChart
                data={chartData}
                width={CHART_SIZE}
                height={CHART_SIZE * 0.7}
                chartConfig={{
                  color: () => "#FFF",
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={String(CHART_SIZE / 4)}
                hasLegend={false}
                absolute
              />
              <View style={themed($donutHole)} />
            </View>

            {/* Legend */}
            <View style={$legendRow}>
              {categories.map((cat, i) => (
                <View key={i} style={$legendItem}>
                  <View style={[$dot, { backgroundColor: cat.color }]} />
                  <Text size="xs" style={themed($legendText)} text={cat.name} />
                </View>
              ))}
            </View>
          </View>
        }
      />

      {/* Top Categories */}
      <Card
        heading="Top Categories"
        style={themed($categoriesCard)}
        ContentComponent={
          <View>
            {categories.slice(0, 4).map((cat, i) => (
              <ListItem
                key={i}
                text={cat.name}
                bottomSeparator={i < 3}
                LeftComponent={
                  <MaterialCommunityIcons
                    name="circle"
                    color={cat.color}
                    size={24}
                    style={$circleIcon}
                  />
                }
                RightComponent={<Text style={$categoryAmount} text={`$${cat.amount.toFixed(2)}`} />}
              />
            ))}
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

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginVertical: spacing.md,
})

const $chartCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xs,
  marginBottom: spacing.md,
  alignItems: "center",
  minHeight: 0,
})

const $chartWrapper: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $donutHole: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  width: DONUT_HOLE,
  height: DONUT_HOLE,
  borderRadius: DONUT_HOLE / 2,
  backgroundColor: colors.background,
})

const $legendRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  gap: 12,
  marginTop: 4,
  marginHorizontal: 8,
}

const $legendItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $dot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
}

const $legendText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $categoriesCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.md,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $circleIcon: TextStyle = {
  alignSelf: "center",
  marginEnd: 12,
}

const $categoryAmount: TextStyle = {
  fontVariant: ["tabular-nums"],
  alignSelf: "center",
}
