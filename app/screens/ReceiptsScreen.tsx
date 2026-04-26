import { FC } from "react"
import { Alert, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { EmptyState } from "@/components/EmptyState"
import { ListItem } from "@/components/ListItem"
import { ReceiptSkeletonList } from "@/components/ReceiptSkeletonList"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { AppStackParamList, TabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { $tabularNums } from "@/theme/typography"

interface ReceiptsScreenProps extends TabScreenProps<"Receipts"> {}

export const ReceiptsScreen: FC<ReceiptsScreenProps> = function ReceiptsScreen({ navigation }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const nav = navigation as unknown as NativeStackNavigationProp<AppStackParamList>
  const { receipts, removeReceipt, isInitialSyncing } = useReceipts()
  const { currency } = useSettings()
  const isEmpty = receipts.length === 0 && !isInitialSyncing

  const handleDelete = (receiptId: string) => {
    Alert.alert("Delete Receipt", "Are you sure you want to delete this receipt?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeReceipt(receiptId)
        },
      },
    ])
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed([$screenContainer, isEmpty && $emptyScreen])}
    >
      {receipts.length === 0 && isInitialSyncing ? (
        <ReceiptSkeletonList count={5} />
      ) : receipts.length === 0 ? (
        <EmptyState
          IconComponent={
            <View style={themed($emptyIconWrapper)}>
              <MaterialCommunityIcons name="receipt-text-outline" size={28} color={colors.accent} />
            </View>
          }
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
              nav.navigate("ReceiptDetail", {
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
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={20}
                    color={colors.accent}
                  />
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
              <View style={$rightRow}>
                {receipt.total != null && (
                  <Text
                    text={formatCurrency(receipt.total, currency)}
                    weight="bold"
                    size="sm"
                    style={$amountText}
                  />
                )}
                <TouchableOpacity onPress={() => handleDelete(receipt.id)} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.textDim}
                  />
                </TouchableOpacity>
              </View>
            }
          />
        ))
      )}
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
})

const $emptyScreen: ThemedStyle<ViewStyle> = () => ({
  flexGrow: 1,
  justifyContent: "center",
})

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
  marginEnd: spacing.sm,
  backgroundColor: colors.accentBackground,
})

const $emptyIconWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.accentBackground,
})

const $dateText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $rightRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  gap: 12,
}

const $amountText: TextStyle = {
  alignSelf: "center",
  ...$tabularNums,
}
