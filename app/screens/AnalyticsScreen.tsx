import { FC, useMemo } from "react"
import { Dimensions, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { PieChart } from "react-native-chart-kit"

import { Card } from "@/components/Card"
import { EmptyState } from "@/components/EmptyState"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCategories } from "@/context/CategoriesContext"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { TabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const CHART_SIZE = Dimensions.get("window").width - 16
const DONUT_HOLE = CHART_SIZE * 0.3

interface AnalyticsScreenProps extends TabScreenProps<"Analytics"> {}

export const AnalyticsScreen: FC<AnalyticsScreenProps> = function AnalyticsScreen() {
  const { themed } = useAppTheme()
  const { receipts } = useReceipts()
  const { categories: allCategories } = useCategories()
  const { currency } = useSettings()

  const categories = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const receipt of receipts) {
      if (receipt.total == null) continue
      const key = receipt.category ?? "other"
      totals[key] = (totals[key] ?? 0) + receipt.total
    }
    return allCategories
      .map((cat) => ({ name: cat.label, amount: totals[cat.id] ?? 0, color: cat.color }))
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [receipts, allCategories])

  const hasData = categories.length > 0

  const chartData = categories.map((cat) => ({
    name: cat.name,
    population: cat.amount,
    color: cat.color,
    legendFontColor: "#999",
    legendFontSize: 0,
  }))

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($screenContainer)}
    >
      <Text preset="heading" style={themed($heading)} text="Analytics" />

      {hasData ? (
        <>
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
                    bottomSeparator={i < Math.min(categories.length, 4) - 1}
                    LeftComponent={
                      <MaterialCommunityIcons
                        name="circle"
                        color={cat.color}
                        size={24}
                        style={$circleIcon}
                      />
                    }
                    RightComponent={
                      <Text style={$categoryAmount} text={formatCurrency(cat.amount, currency)} />
                    }
                  />
                ))}
              </View>
            }
          />
        </>
      ) : (
        <EmptyState
          heading="No Data Yet"
          content="Assign categories to your receipts to see spending breakdowns here"
        />
      )}
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
