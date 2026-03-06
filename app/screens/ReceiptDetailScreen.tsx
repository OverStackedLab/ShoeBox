import { FC, useState } from "react"
import { Alert, Image, ImageStyle, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import * as Device from "expo-device"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { launchScanner } from "@dariyd/react-native-document-scanner"
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition"
import { toast } from "sonner-native"

import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { parseReceiptText } from "@/utils/receiptParser"
import { saveReceiptImage } from "@/utils/receiptStorage"

const ACCENT_RED = "#FF3B30"
const TAX_RATE = 0.0875

interface LineItem {
  id: string
  name: string
  qty: number
  price: number
}

const MOCK_LINE_ITEMS: Record<string, LineItem[]> = {
  "1": [
    { id: "1", name: "Organic Bananas", qty: 1, price: 1.49 },
    { id: "2", name: "Whole Milk (1 gal)", qty: 2, price: 4.99 },
    { id: "3", name: "Sourdough Bread", qty: 1, price: 5.99 },
    { id: "4", name: "Cage-Free Eggs", qty: 1, price: 7.49 },
    { id: "5", name: "Greek Yogurt", qty: 3, price: 2.99 },
  ],
  "2": [
    { id: "1", name: "Shampoo", qty: 1, price: 8.99 },
    { id: "2", name: "Laundry Detergent", qty: 1, price: 14.99 },
    { id: "3", name: "Paper Towels", qty: 2, price: 12.99 },
    { id: "4", name: "Dish Soap", qty: 1, price: 3.99 },
    { id: "5", name: "Toothpaste", qty: 2, price: 4.49 },
    { id: "6", name: "Batteries AA (8pk)", qty: 1, price: 9.99 },
  ],
  "3": [
    { id: "1", name: "NyQuil Severe", qty: 1, price: 12.99 },
    { id: "2", name: "Vitamin C 1000mg", qty: 1, price: 9.49 },
  ],
  "4": [
    { id: "1", name: "2x4x8 Lumber", qty: 10, price: 6.98 },
    { id: "2", name: "Wood Screws (1lb)", qty: 2, price: 8.99 },
    { id: "3", name: "Sandpaper Set", qty: 1, price: 12.99 },
    { id: "4", name: "Wood Glue", qty: 1, price: 7.49 },
  ],
  "5": [
    { id: "1", name: "Pasta (assorted)", qty: 3, price: 1.99 },
    { id: "2", name: "Frozen Waffles", qty: 2, price: 3.49 },
    { id: "3", name: "Dark Chocolate", qty: 4, price: 2.99 },
    { id: "4", name: "Sparkling Water", qty: 2, price: 4.99 },
  ],
  "6": [
    { id: "1", name: "Kirkland Coffee", qty: 1, price: 34.99 },
    { id: "2", name: "Olive Oil (2pk)", qty: 1, price: 19.99 },
    { id: "3", name: "Mixed Nuts (2.5lb)", qty: 1, price: 17.99 },
    { id: "4", name: "Paper Plates", qty: 1, price: 14.99 },
    { id: "5", name: "Bottled Water (40pk)", qty: 1, price: 9.99 },
    { id: "6", name: "Chicken Breast (6lb)", qty: 1, price: 22.99 },
  ],
}

interface ReceiptDetailScreenProps extends AppStackScreenProps<"ReceiptDetail"> {}

export const ReceiptDetailScreen: FC<ReceiptDetailScreenProps> = function ReceiptDetailScreen({
  route,
  navigation,
}) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { receipts, removeReceipt, updateReceipt } = useReceipts()
  const { currency } = useSettings()
  const { receiptId, scannedImages: paramImages, storeName: paramStoreName, date: paramDate, total: paramTotal } = route.params
  const [isProcessing, setIsProcessing] = useState(false)

  // Always prefer context (reflects live edits) over stale route params
  const stored = receipts.find((r) => r.id === receiptId)
  const scannedImages = stored?.scannedImages ?? paramImages ?? []
  const storeName = stored?.storeName ?? paramStoreName
  const date = stored?.date ?? paramDate
  const total = stored?.total ?? paramTotal

  const handleReread = async () => {
    if (!scannedImages.length) {
      toast.warning("No stored image to re-read.")
      return
    }

    setIsProcessing(true)
    const loadingToast = toast.loading("Re-reading receipt…")

    try {
      const { text } = await recognizeText(scannedImages[0].uri)
      const { storeName: newStoreName, date: newDate, total: newTotal } = parseReceiptText(text)
      toast.dismiss(loadingToast)
      updateReceipt(receiptId, { storeName: newStoreName, date: newDate, total: newTotal })
      toast.success("Receipt updated.")
    } catch {
      toast.dismiss(loadingToast)
      toast.error("Could not read receipt text.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRescan = async () => {
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

        const newImages = result.images.map((img, i) => ({
          uri: saveReceiptImage(img.uri, receiptId, i),
          width: img.width,
          height: img.height,
        }))

        try {
          const { text } = await recognizeText(newImages[0].uri)
          const { storeName: newStoreName, date: newDate, total: newTotal } = parseReceiptText(text)
          toast.dismiss(loadingToast)
          updateReceipt(receiptId, {
            scannedImages: newImages,
            storeName: newStoreName,
            date: newDate,
            total: newTotal,
          })
          toast.success("Receipt updated.")
        } catch {
          toast.dismiss(loadingToast)
          toast.error("Could not read receipt text.")
          updateReceipt(receiptId, { scannedImages: newImages })
        } finally {
          setIsProcessing(false)
        }
      }
    } catch {
      toast.error("Failed to launch the document scanner.")
    }
  }

  const handleEditField = (
    field: 'storeName' | 'date' | 'total',
    title: string,
    current: string,
    keyboardType: 'default' | 'decimal-pad' = 'default',
  ) => {
    Alert.prompt(
      title,
      undefined,
      (value) => {
        const trimmed = value.trim()
        if (!trimmed) return
        if (field === 'total') {
          const n = parseFloat(trimmed.replace(/[^0-9.,]/g, '').replace(',', '.'))
          if (!isNaN(n)) updateReceipt(receiptId, { total: n })
        } else {
          updateReceipt(receiptId, { [field]: trimmed })
        }
      },
      'plain-text',
      current,
      keyboardType,
    )
  }

  const handleDelete = () => {
    Alert.alert("Delete Receipt", "Are you sure you want to delete this receipt?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeReceipt(receiptId)
          navigation.goBack()
        },
      },
    ])
  }

  const lineItems = MOCK_LINE_ITEMS[receiptId] ?? []
  const hasLineItems = lineItems.length > 0

  // Only compute subtotal/tax breakdown for mock line item receipts
  const subtotal = hasLineItems
    ? lineItems.reduce((sum, item) => sum + item.qty * item.price, 0)
    : null
  const tax = hasLineItems && subtotal != null ? subtotal * TAX_RATE : null
  const displayTotal = total ?? (subtotal != null && tax != null ? subtotal + tax : null)

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContainer)}
      safeAreaEdges={["top"]}
    >
      <Header
        title="Receipt Detail"
        titleMode="flex"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        safeAreaEdges={[]}
        RightActionComponent={
          <View style={$headerActions}>
            <TouchableOpacity
              onPress={handleReread}
              style={themed($headerActionBtn)}
              activeOpacity={0.7}
              disabled={isProcessing || !scannedImages.length}
            >
              <MaterialCommunityIcons name="text-recognition" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRescan}
              style={themed($headerActionBtn)}
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons name="camera-retake-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toast.info("Share coming soon.")}
              style={themed($headerActionBtn)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={themed($headerActionBtn)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color={ACCENT_RED} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Scanned Images */}
      {scannedImages && scannedImages.length > 0 && (
        <View style={themed($imageSection)}>
          {scannedImages.map((img, index) => (
            <Image
              key={`${receiptId}-${index}`}
              source={{ uri: img.uri }}
              style={[$scannedImage, { aspectRatio: img.width / img.height }]}
              resizeMode="contain"
            />
          ))}
        </View>
      )}

      {/* Receipt Info */}
      <Text text="Details" size="sm" weight="bold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            <ListItem
              height={52}
              bottomSeparator
              onPress={() => handleEditField('storeName', 'Edit Merchant', storeName ?? '')}
              LeftComponent={
                <View style={$rowLeft}>
                  <MaterialCommunityIcons
                    name="store-outline"
                    size={16}
                    color={colors.textDim}
                    style={$rowIcon}
                  />
                  <Text text="Merchant" size="sm" style={themed($labelText)} />
                </View>
              }
              RightComponent={
                <View style={$editRow}>
                  <Text
                    text={storeName ?? `Receipt #${receiptId}`}
                    size="sm"
                    weight="medium"
                    style={$valueText}
                  />
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.textDim} style={$editIcon} />
                </View>
              }
            />
            <ListItem
              height={52}
              onPress={() => handleEditField('date', 'Edit Date', date ?? '')}
              LeftComponent={
                <View style={$rowLeft}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={16}
                    color={colors.textDim}
                    style={$rowIcon}
                  />
                  <Text text="Date" size="sm" style={themed($labelText)} />
                </View>
              }
              RightComponent={
                <View style={$editRow}>
                  <Text text={date ?? "—"} size="sm" weight="medium" style={$valueText} />
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.textDim} style={$editIcon} />
                </View>
              }
            />
          </View>
        }
      />

      {/* Line Items */}
      {hasLineItems && (
        <>
          <Text text="Items" size="sm" weight="bold" uppercase style={themed($sectionHeading)} />
          <Card
            style={themed($cardBase)}
            ContentComponent={
              <View>
                {lineItems.map((item, index) => (
                  <ListItem
                    key={item.id}
                    height={52}
                    bottomSeparator={index < lineItems.length - 1}
                    LeftComponent={
                      <View style={$itemLeft}>
                        <Text text={item.name} size="sm" />
                        {item.qty > 1 && (
                          <Text text={`× ${item.qty}`} size="xxs" style={themed($qtyText)} />
                        )}
                      </View>
                    }
                    RightComponent={
                      <Text
                        text={formatCurrency(item.qty * item.price, currency)}
                        size="sm"
                        style={[$valueText, themed($dimText)]}
                      />
                    }
                  />
                ))}
              </View>
            }
          />
        </>
      )}

      {/* Summary */}
      <Text text="Summary" size="sm" weight="bold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            {subtotal != null && (
              <ListItem
                height={48}
                bottomSeparator
                LeftComponent={<Text text="Subtotal" size="sm" style={themed($dimText)} />}
                RightComponent={
                  <Text
                    text={formatCurrency(subtotal, currency)}
                    size="sm"
                    style={[$valueText, themed($dimText)]}
                  />
                }
              />
            )}
            {tax != null && (
              <ListItem
                height={48}
                bottomSeparator
                LeftComponent={
                  <Text
                    text={`Tax (${(TAX_RATE * 100).toFixed(2)}%)`}
                    size="sm"
                    style={themed($dimText)}
                  />
                }
                RightComponent={
                  <Text
                    text={formatCurrency(tax, currency)}
                    size="sm"
                    style={[$valueText, themed($dimText)]}
                  />
                }
              />
            )}
            <ListItem
              height={56}
              onPress={() =>
                handleEditField('total', 'Edit Total', total?.toString() ?? '', 'decimal-pad')
              }
              LeftComponent={<Text text="Total" size="sm" weight="bold" />}
              RightComponent={
                <View style={$editRow}>
                  <Text
                    text={displayTotal != null ? formatCurrency(displayTotal, currency) : "—"}
                    size="md"
                    weight="bold"
                    style={$valueText}
                  />
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.textDim} style={$editIcon} />
                </View>
              }
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

const $headerActions: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $headerActionBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $imageSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  marginBottom: spacing.xs,
})

const $scannedImage: ImageStyle = {
  width: "100%",
  borderRadius: 12,
}

const $sectionHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.lg,
  marginBottom: spacing.xs,
  marginLeft: spacing.xs,
})

const $cardBase: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $rowLeft: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $rowIcon: ViewStyle = {
  marginRight: 8,
}

const $labelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $valueText: TextStyle = {
  alignSelf: "center",
  fontVariant: ["tabular-nums"],
}

const $itemLeft: ViewStyle = {
  alignSelf: "center",
  gap: 2,
}

const $qtyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $editRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $editIcon: ViewStyle = {
  marginLeft: 4,
}
