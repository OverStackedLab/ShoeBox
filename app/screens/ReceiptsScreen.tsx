import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { EmptyState } from "@/components/EmptyState"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ReceiptsScreenProps extends DemoTabScreenProps<"Receipts"> {}

export const ReceiptsScreen: FC<ReceiptsScreenProps> = function ReceiptsScreen({ navigation }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const { receipts } = useReceipts()
  const { currency } = useSettings()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($screenContainer)}
    >
      <Header
        title="Receipts"
        titleMode="flex"
        titleStyle={$headerTitle}
        safeAreaEdges={[]}
        rightIcon="bell"
        rightIconColor={colors.text}
      />

      {receipts.length === 0 ? (
        <EmptyState
          heading="No Receipts Yet"
          content="Scan your first receipt to get started"
          button="Scan Receipt"
          buttonOnPress={() => navigation.navigate("Home", {})}
        />
      ) : (
        receipts.map((receipt, index) => (
          <ListItem
            key={receipt.id}
            height={72}
            bottomSeparator={index < receipts.length - 1}
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigation as any).navigate("ReceiptDetail", {
                receiptId: receipt.id,
                scannedImages: receipt.scannedImages,
                storeName: receipt.storeName,
                date: receipt.date,
                total: receipt.total,
              })
            }
            LeftComponent={
              <View style={$receiptLeftRow}>
                <View style={themed($receiptIconWrapper)}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={20} color={"#E8981E"} />
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
                    style={themed($dateText)}
                  />
                </View>
              </View>
            }
            RightComponent={
              receipt.total != null ? (
                <Text
                  text={formatCurrency(receipt.total, currency)}
                  weight="bold"
                  size="sm"
                  style={$amountText}
                />
              ) : undefined
            }
          />
        ))
      )}
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

const $receiptLeftRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $receiptIconWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  marginEnd: 12,
  backgroundColor: colors.tint + "20",
})

const $dateText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $amountText: TextStyle = {
  alignSelf: "center",
  fontVariant: ["tabular-nums"],
}
