import { FC, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import * as Device from "expo-device"
import { launchScanner } from "@dariyd/react-native-document-scanner"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition"
import { BarChart } from "react-native-chart-kit"
import { Circle, Svg, SvgXml } from "react-native-svg"
import { toast } from "sonner-native"

import { Card } from "@/components/Card"
import { EmptyState } from "@/components/EmptyState"
import { ListItem } from "@/components/ListItem"
import { ReceiptSkeletonList, SkeletonBlock } from "@/components/ReceiptSkeletonList"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCategories } from "@/context/CategoriesContext"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { TabScreenProps } from "@/navigators/navigationTypes"
import { categorizeReceipt } from "@/services/ai/categorizeReceipt"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { $tabularNums } from "@/theme/typography"
import { parseReceiptText } from "@/utils/receiptParser"
import { saveReceiptImage } from "@/utils/receiptStorage"

const getShoeboxScannerSvg = (
  iconColor: string,
) => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="23" y="15" width="34" height="50" rx="3" fill="none" stroke="${iconColor}" stroke-width="2" />
  <rect x="29" y="23" width="22" height="3" rx="1.5" fill="${iconColor}" />
  <rect x="29" y="30" width="16" height="2" rx="1" fill="${iconColor}" opacity="0.5" />
  <rect x="29" y="36" width="19" height="2" rx="1" fill="${iconColor}" opacity="0.5" />
  <rect x="29" y="42" width="13" height="2" rx="1" fill="${iconColor}" opacity="0.5" />
  <rect x="29" y="48" width="17" height="2" rx="1" fill="${iconColor}" opacity="0.4" />
  <path d="M4 18 L4 4 L18 4" fill="none" stroke="${iconColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M62 4 L76 4 L76 18" fill="none" stroke="${iconColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M4 62 L4 76 L18 76" fill="none" stroke="${iconColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M76 62 L76 76 L62 76" fill="none" stroke="${iconColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`

const SCREEN_PADDING = 24
const CHART_WIDTH = Dimensions.get("window").width - SCREEN_PADDING * 2
const SCAN_BUTTON_SIZE = 220

interface HomeScreenProps extends TabScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = function HomeScreen({ navigation }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [isProcessing, setIsProcessing] = useState(false)
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    animation.start()
    return () => animation.stop()
  }, [pulseAnim])

  const { receipts, addReceipt, updateReceipt, setCategorizing, isInitialSyncing } = useReceipts()
  const { categories } = useCategories()
  const { currency, aiReceiptReading } = useSettings()
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("monthly")

  const spendingData = useMemo(() => {
    const now = new Date()

    if (viewMode === "daily") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i))
        return {
          label: d.toLocaleString("default", { weekday: "short" }).charAt(0),
          key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
          total: 0,
        }
      })
      for (const receipt of receipts) {
        if (receipt.total == null) continue
        const d = new Date(receipt.createdAt)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        const entry = days.find((x) => x.key === key)
        if (entry) entry.total += receipt.total
      }
      return days
    }

    if (viewMode === "weekly") {
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay())
      const weeks = Array.from({ length: 6 }, (_, i) => {
        const start = new Date(startOfThisWeek)
        start.setDate(start.getDate() - (5 - i) * 7)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        return {
          label: `${start.getMonth() + 1}/${start.getDate()}`,
          start: start.getTime(),
          end: end.getTime(),
          total: 0,
        }
      })
      for (const receipt of receipts) {
        if (receipt.total == null) continue
        const t = new Date(receipt.createdAt).getTime()
        const entry = weeks.find((w) => t >= w.start && t < w.end)
        if (entry) entry.total += receipt.total
      }
      return weeks
    }

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        label: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        total: 0,
      }
    })
    for (const receipt of receipts) {
      if (receipt.total == null) continue
      const d = new Date(receipt.createdAt)
      const entry = months.find(
        (m) => "year" in m && m.year === d.getFullYear() && m.month === d.getMonth(),
      )
      if (entry) entry.total += receipt.total
    }
    return months
  }, [receipts, viewMode])

  const hasSpendingData = spendingData.some((m) => m.total > 0)
  const currentPeriodTotal = spendingData[spendingData.length - 1].total
  const chartData = {
    labels: spendingData.map((m) => m.label),
    datasets: [{ data: spendingData.map((m) => (m.total > 0 ? m.total : 0)) }],
  }
  const yAxisLabel = currency === "HUF" ? "" : "$"
  const yAxisSuffix = currency === "HUF" ? " Ft" : ""

  const handleScanReceipt = async () => {
    if (!Device.isDevice) {
      toast.warning("Document scanning requires a physical device.")
      return
    }

    try {
      const result = await launchScanner({ quality: 0.8 })

      if (result.didCancel) return

      if (result.error) {
        toast.error(result.errorMessage ?? "Something went wrong.")
        return
      }

      if (result.images?.length) {
        setIsProcessing(true)
        const loadingToast = toast.loading("Reading receipt…")

        const receiptId = Date.now().toString()
        const latestImage = result.images[result.images.length - 1]
        const scannedImages = [
          {
            uri: saveReceiptImage(latestImage.uri, receiptId, 0),
            width: latestImage.width,
            height: latestImage.height,
          },
        ]

        try {
          const { text } = await recognizeText(scannedImages[0].uri)
          // In AI-only mode, leave fields empty and let categorizeReceipt populate them.
          const { storeName, date, total }: ReturnType<typeof parseReceiptText> = aiReceiptReading
            ? {}
            : parseReceiptText(text)
          toast.dismiss(loadingToast)

          addReceipt({
            id: receiptId,
            storeName,
            date,
            total,
            scannedImages,
            createdAt: Date.now(),
          })
          navigation.navigate("ReceiptDetail", {
            receiptId,
            scannedImages,
            storeName,
            date,
            total,
          })

          setCategorizing(receiptId, true)
          categorizeReceipt({
            text,
            categories: categories.map((c) => ({
              id: c.id,
              label: c.label,
              description: c.description,
            })),
          })
            .then((result) => {
              if (!result) return
              const updates: Parameters<typeof updateReceipt>[1] = {}
              if (result.categoryId) updates.category = result.categoryId
              if (result.products?.length) updates.products = result.products
              if (result.storeName) updates.storeName = result.storeName
              if (result.date) updates.date = result.date
              if (result.total != null) updates.total = result.total
              if (Object.keys(updates).length) updateReceipt(receiptId, updates)
            })
            .catch(console.error)
            .finally(() => setCategorizing(receiptId, false))
        } catch {
          toast.dismiss(loadingToast)
          toast.error("Could not read receipt text.")
          addReceipt({ id: receiptId, scannedImages, createdAt: Date.now() })
          navigation.navigate("ReceiptDetail", { receiptId, scannedImages })
        } finally {
          setIsProcessing(false)
        }
      }
    } catch {
      toast.error("Failed to launch the document scanner.")
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      {/* Scan Receipt */}
      <View style={themed($scanSection)}>
        <View style={$scanButtonContainer}>
          <Animated.View
            style={[
              $spinnerContainer,
              {
                transform: [
                  {
                    rotate: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={SPINNER_RADIUS}
                stroke={colors.palette.neutral500}
                strokeWidth={SPINNER_STROKE}
                strokeOpacity={0.15}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={SPINNER_RADIUS}
                stroke={colors.accentAlt}
                strokeWidth={SPINNER_STROKE}
                fill="none"
                strokeDasharray={`${SPINNER_ARC} ${SPINNER_GAP}`}
                strokeLinecap="butt"
              />
            </Svg>
          </Animated.View>
          <View style={themed($scanButtonRing)}>
            <TouchableOpacity
              style={themed($scanButton)}
              activeOpacity={0.8}
              onPress={handleScanReceipt}
              disabled={isProcessing}
            >
              <SvgXml xml={getShoeboxScannerSvg(colors.onAccent)} width={100} height={100} />
            </TouchableOpacity>
          </View>
        </View>
        <Text text="Scan Receipt" preset="formLabel" style={themed($scanLabel)} />
      </View>

      {/* Recent Expenses */}
      <View style={themed($sectionRow)}>
        <Text text="Recent Expenses" preset="sectionHeading" style={themed($sectionHeading)} />
        <TouchableOpacity onPress={() => navigation.navigate("Receipts")}>
          <Text text="See All" size="xs" style={themed($seeAllText)} />
        </TouchableOpacity>
      </View>
      <Card
        preset="flat"
        ContentComponent={
          <View>
            {receipts.length === 0 && isInitialSyncing ? (
              <ReceiptSkeletonList count={5} rowHeight={64} />
            ) : receipts.length === 0 ? (
              <EmptyState
                style={themed($emptyState)}
                IconComponent={
                  <View style={themed($emptyIconWrapper)}>
                    <MaterialCommunityIcons name="receipt" size={28} color={colors.accent} />
                  </View>
                }
                heading="No expenses yet"
                content="Scan your first receipt to start tracking your spending"
                button=""
              />
            ) : (
              receipts.slice(0, 5).map((receipt, index, arr) => (
                <ListItem
                  key={receipt.id}
                  height={64}
                  bottomSeparator={index < arr.length - 1}
                  onPress={() =>
                    navigation.navigate("ReceiptDetail", {
                      receiptId: receipt.id,
                      scannedImages: receipt.scannedImages,
                      storeName: receipt.storeName,
                      date: receipt.date,
                      total: receipt.total,
                    })
                  }
                  LeftComponent={
                    <View style={$expenseLeftRow}>
                      <View style={themed($expenseIconWrapper)}>
                        <MaterialCommunityIcons name="receipt" size={20} color={colors.accent} />
                      </View>
                      <View>
                        <Text
                          text={receipt.storeName ?? `Receipt #${receipt.id.slice(-4)}`}
                          size="sm"
                          weight="medium"
                        />
                        <Text
                          text={receipt.date ?? new Date(receipt.createdAt).toLocaleDateString()}
                          size="xxs"
                          style={themed($expenseDate)}
                        />
                      </View>
                    </View>
                  }
                  RightComponent={
                    receipt.total != null ? (
                      <Text
                        text={`-${formatCurrency(receipt.total, currency)}`}
                        weight="bold"
                        size="sm"
                        style={$expenseAmount}
                      />
                    ) : undefined
                  }
                />
              ))
            )}
          </View>
        }
      />

      {/* Spending */}
      <View style={themed($sectionRow)}>
        <Text text="Spending" preset="sectionHeading" style={themed($sectionHeading)} />
        {hasSpendingData && (
          <Text
            text={formatCurrency(currentPeriodTotal, currency)}
            size="sm"
            weight="bold"
            style={$expenseAmount}
          />
        )}
      </View>
      <View style={themed($segmentedControl)}>
        {(["daily", "weekly", "monthly"] as const).map((mode) => {
          const isActive = viewMode === mode
          return (
            <TouchableOpacity
              key={mode}
              activeOpacity={0.8}
              onPress={() => setViewMode(mode)}
              style={themed(isActive ? $segmentActive : $segment)}
            >
              <Text
                text={mode.charAt(0).toUpperCase() + mode.slice(1)}
                size="xs"
                weight={isActive ? "medium" : "normal"}
                style={isActive ? themed($segmentTextActive) : themed($segmentText)}
              />
            </TouchableOpacity>
          )
        })}
      </View>
      <Card
        preset="flat"
        ContentComponent={
          !hasSpendingData && isInitialSyncing ? (
            <View style={$chartContainer}>
              <SkeletonBlock width="100%" height={200} borderRadius={8} />
            </View>
          ) : hasSpendingData ? (
            <View style={$chartContainer}>
              <BarChart
                data={chartData}
                width={CHART_WIDTH - 32}
                height={200}
                yAxisLabel={yAxisLabel}
                yAxisSuffix={yAxisSuffix}
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
                  color: () => colors.accent,
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
          ) : (
            <EmptyState
              style={themed($emptyState)}
              IconComponent={
                <View style={themed($emptyIconWrapper)}>
                  <MaterialCommunityIcons name="chart-bar" size={28} color={colors.accent} />
                </View>
              }
              heading="No spending data yet"
              content="Your monthly totals will appear here"
              button=""
            />
          )
        }
      />
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
})

const $scanSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.lg,
})

const $scanButtonContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $spinnerContainer: ViewStyle = {
  position: "absolute",
}

const SPINNER_STROKE = 20
const RING_SIZE = SCAN_BUTTON_SIZE + SPINNER_STROKE * 2 + 8
const SPINNER_RADIUS = RING_SIZE / 2 - SPINNER_STROKE / 2
const SPINNER_CIRCUMFERENCE = 2 * Math.PI * SPINNER_RADIUS
const SPINNER_ARC = SPINNER_CIRCUMFERENCE * 0.2
const SPINNER_GAP = SPINNER_CIRCUMFERENCE * 0.8

const $scanButtonRing: ThemedStyle<ViewStyle> = () => ({
  width: SCAN_BUTTON_SIZE + spacing.md,
  height: SCAN_BUTTON_SIZE + spacing.md,
  borderRadius: (SCAN_BUTTON_SIZE + spacing.md) / 2,
  alignItems: "center",
  justifyContent: "center",
})

const $scanButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: SCAN_BUTTON_SIZE,
  height: SCAN_BUTTON_SIZE,
  borderRadius: SCAN_BUTTON_SIZE / 2,
  backgroundColor: colors.accent,
  alignItems: "center",
  justifyContent: "center",
})

const $scanLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
})

const $sectionHeading: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $sectionRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.lg,
  marginBottom: spacing.xs,
})

const $seeAllText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $expenseLeftRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $expenseIconWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  marginEnd: spacing.sm,
  backgroundColor: colors.accentBackground,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $emptyIconWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.accentBackground,
})

const $expenseDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $expenseAmount: TextStyle = {
  alignSelf: "center",
  ...$tabularNums,
}

const $segmentedControl: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  padding: 2,
  marginBottom: spacing.xs,
})

const $segment: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingVertical: spacing.xs,
  alignItems: "center",
  borderRadius: 6,
})

const $segmentActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  paddingVertical: spacing.xs,
  alignItems: "center",
  borderRadius: 6,
  backgroundColor: colors.background,
})

const $segmentText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $segmentTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $chartContainer: ViewStyle = {
  alignItems: "center",
  marginTop: spacing.xs,
}

const $chartStyle: ViewStyle = {
  borderRadius: 8,
}
