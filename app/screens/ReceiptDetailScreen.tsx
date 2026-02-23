import { FC } from "react"
import { Image, ImageStyle, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { toast } from "sonner-native"

import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

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
  const { receiptId, scannedImages, storeName, date, total } = route.params

  const lineItems = MOCK_LINE_ITEMS[receiptId] ?? []
  const hasLineItems = lineItems.length > 0

  const subtotal = hasLineItems
    ? lineItems.reduce((sum, item) => sum + item.qty * item.price, 0)
    : total != null
      ? total / (1 + TAX_RATE)
      : null
  const tax = subtotal != null ? subtotal * TAX_RATE : null
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
              onPress={() => toast.info("Share coming soon.")}
              style={themed($headerActionBtn)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toast.warning("Delete coming soon.")}
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
      <Text
        text="Details"
        size="sm"
        weight="bold"
        uppercase
        style={themed($sectionHeading)}
      />
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            <ListItem
              height={52}
              bottomSeparator
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
                <Text
                  text={storeName ?? `Receipt #${receiptId}`}
                  size="sm"
                  weight="medium"
                  style={$valueText}
                />
              }
            />
            <ListItem
              height={52}
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
                <Text text={date ?? "—"} size="sm" weight="medium" style={$valueText} />
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
                          <Text
                            text={`× ${item.qty}`}
                            size="xxs"
                            style={themed($qtyText)}
                          />
                        )}
                      </View>
                    }
                    RightComponent={
                      <Text
                        text={`$${(item.qty * item.price).toFixed(2)}`}
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
                LeftComponent={
                  <Text text="Subtotal" size="sm" style={themed($dimText)} />
                }
                RightComponent={
                  <Text
                    text={`$${subtotal.toFixed(2)}`}
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
                  <Text text={`Tax (${(TAX_RATE * 100).toFixed(2)}%)`} size="sm" style={themed($dimText)} />
                }
                RightComponent={
                  <Text
                    text={`$${tax.toFixed(2)}`}
                    size="sm"
                    style={[$valueText, themed($dimText)]}
                  />
                }
              />
            )}
            <ListItem
              height={56}
              LeftComponent={<Text text="Total" size="sm" weight="bold" />}
              RightComponent={
                <Text
                  text={displayTotal != null ? `$${displayTotal.toFixed(2)}` : "—"}
                  size="md"
                  weight="bold"
                  style={$valueText}
                />
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
