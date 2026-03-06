import { FC, useState } from "react"
import { Dimensions, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import * as Device from "expo-device"
import { launchScanner } from "@dariyd/react-native-document-scanner"
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons"
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition"
import { BarChart } from "react-native-chart-kit"
import { toast } from "sonner-native"

import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { parseReceiptText } from "@/utils/receiptParser"
import { saveReceiptImage } from "@/utils/receiptStorage"

const SCREEN_PADDING = 24
const CHART_WIDTH = Dimensions.get("window").width - SCREEN_PADDING * 2
const ACCENT_ORANGE = "#E8981E"
const SCAN_BUTTON_SIZE = 220

const monthlySpendingData = {
  labels: ["", "", "", "", "", "", "", "", "", "", "", ""],
  datasets: [
    {
      data: [500, 2200, 800, 5200, 8500, 7800, 5500, 3200, 6800, 7200, 5800, 6500],
    },
  ],
}

interface HomeScreenProps extends DemoTabScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = function HomeScreen({ navigation }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [isProcessing, setIsProcessing] = useState(false)
  const { receipts, addReceipt } = useReceipts()
  const { currency } = useSettings()

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
        const scannedImages = result.images.map((img, i) => ({
          uri: saveReceiptImage(img.uri, receiptId, i),
          width: img.width,
          height: img.height,
        }))

        try {
          const { text } = await recognizeText(scannedImages[0].uri)
          const { storeName, date, total } = parseReceiptText(text)
          toast.dismiss(loadingToast)

          addReceipt({
            id: receiptId,
            storeName,
            date,
            total,
            scannedImages,
            createdAt: Date.now(),
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(navigation as any).navigate("ReceiptDetail", {
            receiptId,
            scannedImages,
            storeName,
            date,
            total,
          })
        } catch {
          toast.dismiss(loadingToast)
          toast.error("Could not read receipt text.")
          addReceipt({ id: receiptId, scannedImages, createdAt: Date.now() })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(navigation as any).navigate("ReceiptDetail", { receiptId, scannedImages })
        } finally {
          setIsProcessing(false)
        }
      }
    } catch {
      toast.error("Failed to launch the document scanner.")
    }
  }

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
              <TouchableOpacity
                style={$scanButton}
                activeOpacity={0.8}
                onPress={handleScanReceipt}
                disabled={isProcessing}
              >
                <AntDesign name="scan" size={100} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text text="Scan Receipt" weight="medium" size="sm" style={themed($scanLabel)} />
          </View>
        }
      />

      {/* Recent Expenses */}
      <View style={themed($sectionRow)}>
        <Text
          text="Recent Expenses"
          size="sm"
          weight="bold"
          uppercase
          style={themed($sectionHeading)}
        />
        <TouchableOpacity>
          <Text text="See All" size="xs" style={themed($seeAllText)} />
        </TouchableOpacity>
      </View>
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            {receipts.length === 0 ? (
              <ListItem
                height={64}
                LeftComponent={
                  <Text
                    text="No receipts yet. Scan one to get started."
                    size="sm"
                    style={themed($expenseDate)}
                  />
                }
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
                      <View
                        style={[$expenseIconWrapper, { backgroundColor: ACCENT_ORANGE + "20" }]}
                      >
                        <MaterialCommunityIcons name="receipt" size={20} color={ACCENT_ORANGE} />
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

      {/* Monthly Spending */}
      <Text
        text="Monthly Spending"
        size="sm"
        weight="bold"
        uppercase
        style={themed($sectionHeading)}
      />
      <Card
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
  borderWidth: 0,
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
  borderWidth: 1,
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
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  marginBottom: spacing.xs,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $sectionHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.lg,
  marginBottom: spacing.xs,
  marginLeft: spacing.xs,
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
