import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { EmptyState } from "@/components/EmptyState"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface Receipt {
  id: string
  storeName: string
  date: string
  total: number
}

const MOCK_RECEIPTS: Receipt[] = [
  { id: "1", storeName: "Whole Foods Market", date: "02/15/2026", total: 87.43 },
  { id: "2", storeName: "Target", date: "02/12/2026", total: 124.99 },
  { id: "3", storeName: "CVS Pharmacy", date: "02/10/2026", total: 23.5 },
  { id: "4", storeName: "Home Depot", date: "02/08/2026", total: 215.0 },
  { id: "5", storeName: "Trader Joe's", date: "02/05/2026", total: 65.32 },
  { id: "6", storeName: "Costco", date: "02/01/2026", total: 342.18 },
]

interface ReceiptsScreenProps extends DemoTabScreenProps<"Receipts"> {}

export const ReceiptsScreen: FC<ReceiptsScreenProps> = function ReceiptsScreen({ navigation }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const receipts = MOCK_RECEIPTS

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
              navigation.navigate("ReceiptDetail", {
                receiptId: receipt.id,
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
                  <Text text={receipt.storeName} size="sm" weight="medium" />
                  <Text text={receipt.date} size="xxs" style={themed($dateText)} />
                </View>
              </View>
            }
            RightComponent={
              <Text
                text={`$${receipt.total.toFixed(2)}`}
                weight="bold"
                size="sm"
                style={$amountText}
              />
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
