import { ComponentProps, FC, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageStyle,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import * as Device from "expo-device"
import { launchScanner } from "@dariyd/react-native-document-scanner"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { toast } from "sonner-native"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCategories } from "@/context/CategoriesContext"
import { useReceipts } from "@/context/ReceiptsContext"
import { formatCurrency, useSettings } from "@/context/SettingsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { categorizeReceipt } from "@/services/ai/categorizeReceipt"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"
import { $tabularNums } from "@/theme/typography"
import { parseReceiptText } from "@/utils/receiptParser"
import { saveReceiptImage } from "@/utils/receiptStorage"

interface OcrLine {
  text: string
  frame: { left: number; top: number; right: number; bottom: number }
}

interface ReceiptDetailScreenProps extends AppStackScreenProps<"ReceiptDetail"> {}

interface ReceiptActionButtonProps {
  accessibilityLabel: string
  color?: string
  disabled?: boolean
  name: ComponentProps<typeof MaterialCommunityIcons>["name"]
  onPress: () => void
}

function ReceiptActionButton({
  accessibilityLabel,
  color,
  disabled,
  name,
  onPress,
}: ReceiptActionButtonProps) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const iconColor = disabled ? colors.textDim : (color ?? colors.text)

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={themed($actionBtn)}
    >
      <MaterialCommunityIcons name={name} size={22} color={iconColor} />
    </TouchableOpacity>
  )
}

export const ReceiptDetailScreen: FC<ReceiptDetailScreenProps> = function ReceiptDetailScreen({
  route,
  navigation,
}) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const receiptsCtx = useReceipts()
  const { receipts, removeReceipt, updateReceipt, categorizingIds, setCategorizing } = receiptsCtx
  const { categories } = useCategories()
  const { currency } = useSettings()
  const {
    receiptId,
    scannedImages: paramImages,
    storeName: paramStoreName,
    date: paramDate,
    total: paramTotal,
  } = route.params
  const insets = useSafeAreaInsets()
  const [isProcessing, setIsProcessing] = useState(false)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [ocrOverlayVisible, setOcrOverlayVisible] = useState(false)
  const [ocrLines, setOcrLines] = useState<OcrLine[]>([])
  const [imageContainerWidth, setImageContainerWidth] = useState(0)

  // Always prefer context (reflects live edits) over stale route params
  const stored = receipts.find((r) => r.id === receiptId)
  const scannedImages = stored?.scannedImages ?? paramImages ?? []
  const storeName = stored?.storeName ?? paramStoreName
  const date = stored?.date ?? paramDate
  const total = stored?.total ?? paramTotal
  const category = stored?.category
  const products = stored?.products ?? []
  const isCategorizing = categorizingIds.has(receiptId)

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

  const handleAutoCategorize = async () => {
    if (!scannedImages.length && !storeName) {
      toast.warning("Not enough info to categorize.")
      return
    }
    setIsProcessing(true)
    setCategorizing(receiptId, true)
    const loadingToast = toast.loading("Categorizing…")
    try {
      let text = ""
      if (scannedImages.length) {
        const result = await recognizeText(scannedImages[0].uri)
        text = result.text
      }
      const aiResult = await categorizeReceipt({
        text,
        categories: categories.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        })),
      })
      toast.dismiss(loadingToast)
      if (aiResult?.categoryId) {
        const updates: Parameters<typeof updateReceipt>[1] = { category: aiResult.categoryId }
        if (aiResult.products?.length) updates.products = aiResult.products
        if (aiResult.storeName) updates.storeName = aiResult.storeName
        if (aiResult.date) updates.date = aiResult.date
        if (aiResult.total != null) updates.total = aiResult.total
        updateReceipt(receiptId, updates)
        toast.success("Receipt updated.")
      } else {
        toast.error("Could not categorize receipt.")
      }
    } catch {
      toast.dismiss(loadingToast)
      toast.error("Could not categorize receipt.")
    } finally {
      setIsProcessing(false)
      setCategorizing(receiptId, false)
    }
  }

  const handleSelectText = async () => {
    if (!scannedImages.length) return
    setIsProcessing(true)
    try {
      const result = await recognizeText(scannedImages[0].uri)
      const lines: OcrLine[] = result.blocks.flatMap((b) => b.lines)
      setOcrLines(lines)
      setOcrOverlayVisible(true)
    } catch {
      toast.error("Could not read receipt text.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLineTap = (text: string) => {
    Alert.alert(text, "Apply as:", [
      {
        text: "Merchant",
        onPress: () => {
          updateReceipt(receiptId, { storeName: text })
          setOcrOverlayVisible(false)
        },
      },
      {
        text: "Date",
        onPress: () => {
          updateReceipt(receiptId, { date: text })
          setOcrOverlayVisible(false)
        },
      },
      {
        text: "Total",
        onPress: () => {
          const n = parseFloat(text.replace(/[^0-9.]/g, ""))
          if (!isNaN(n)) {
            updateReceipt(receiptId, { total: n })
            setOcrOverlayVisible(false)
          } else {
            Alert.alert("Invalid", `"${text}" is not a valid amount.`)
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ])
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

        const latestImage = result.images[result.images.length - 1]
        const newImages = [
          {
            uri: saveReceiptImage(latestImage.uri, receiptId, 0),
            width: latestImage.width,
            height: latestImage.height,
          },
        ]

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
    field: "storeName" | "date" | "total",
    title: string,
    current: string,
    keyboardType: "default" | "decimal-pad" = "default",
  ) => {
    Alert.prompt(
      title,
      undefined,
      (value) => {
        const trimmed = value.trim()
        if (!trimmed) return
        if (field === "total") {
          const n = parseFloat(trimmed.replace(/[^0-9.,]/g, "").replace(",", "."))
          if (!isNaN(n)) updateReceipt(receiptId, { total: n })
        } else {
          updateReceipt(receiptId, { [field]: trimmed })
        }
      },
      "plain-text",
      current,
      keyboardType,
    )
  }

  const handleEditProductName = (index: number) => {
    const product = products[index]
    if (!product) return
    Alert.prompt(
      "Edit Product",
      "Product name",
      (value) => {
        const name = value.trim()
        if (!name) return
        const next = products.map((p, i) => (i === index ? { ...p, name } : p))
        updateReceipt(receiptId, { products: next })
      },
      "plain-text",
      product.name,
    )
  }

  const handleEditProductPrice = (index: number) => {
    const product = products[index]
    if (!product) return
    Alert.prompt(
      "Edit Price",
      "Price (leave blank to clear)",
      (value) => {
        const trimmed = value.trim()
        let price: number | null = null
        if (trimmed) {
          const n = parseFloat(trimmed.replace(/[^0-9.,]/g, "").replace(",", "."))
          price = isNaN(n) ? null : n
        }
        const next = products.map((p, i) => (i === index ? { ...p, price } : p))
        updateReceipt(receiptId, { products: next })
      },
      "plain-text",
      product.price != null ? String(product.price) : "",
      "decimal-pad",
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

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContainer)}
      safeAreaEdges={["top"]}
    >
      <Header
        title="Receipt Detail"
        titleMode="center"
        leftIcon="back"
        leftIconColor={colors.text}
        onLeftPress={() => navigation.goBack()}
        safeAreaEdges={[]}
      />
      <View style={themed($actionRow)}>
        <ReceiptActionButton
          accessibilityLabel="Select receipt text"
          disabled={isProcessing || !scannedImages.length}
          name="cursor-text"
          onPress={handleSelectText}
        />
        <ReceiptActionButton
          accessibilityLabel="Re-read receipt text"
          disabled={isProcessing || !scannedImages.length}
          name="text-recognition"
          onPress={handleReread}
        />
        <ReceiptActionButton
          accessibilityLabel="Auto-categorize receipt"
          disabled={isProcessing}
          name="auto-fix"
          onPress={handleAutoCategorize}
        />
        <ReceiptActionButton
          accessibilityLabel="Rescan receipt"
          disabled={isProcessing}
          name="camera-retake-outline"
          onPress={handleRescan}
        />
        <ReceiptActionButton
          accessibilityLabel="Share receipt"
          name="share-variant-outline"
          onPress={() => toast.info("Share coming soon.")}
        />
        <ReceiptActionButton
          accessibilityLabel="Delete receipt"
          color={colors.error}
          name="delete-outline"
          onPress={handleDelete}
        />
      </View>

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
      <Text text="Details" preset="sectionHeading" style={themed($sectionHeading)} />
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            <ListItem
              height={52}
              bottomSeparator
              onPress={() => handleEditField("storeName", "Edit Merchant", storeName ?? "")}
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
              bottomSeparator
              onPress={() => handleEditField("date", "Edit Date", date ?? "")}
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
            <ListItem
              height={52}
              onPress={() => setCategoryModalVisible(true)}
              LeftComponent={
                <View style={$rowLeft}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={16}
                    color={colors.textDim}
                    style={$rowIcon}
                  />
                  <Text text="Category" size="sm" style={themed($labelText)} />
                </View>
              }
              RightComponent={
                <View style={$editRow}>
                  {isCategorizing && !category ? (
                    <ActivityIndicator size="small" color={colors.textDim} />
                  ) : (
                    <>
                      {category && (
                        <View
                          style={[
                            $categoryDot,
                            {
                              backgroundColor: categories.find((c) => c.id === category)?.color,
                            },
                          ]}
                        />
                      )}
                      <Text
                        text={categories.find((c) => c.id === category)?.label ?? "—"}
                        size="sm"
                        weight="medium"
                        style={$valueText}
                      />
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color={colors.textDim}
                        style={$editIcon}
                      />
                    </>
                  )}
                </View>
              }
            />
          </View>
        }
      />

      {/* OCR Text Selection Overlay */}
      <Modal
        visible={ocrOverlayVisible}
        animationType="slide"
        onRequestClose={() => setOcrOverlayVisible(false)}
      >
        <SafeAreaView style={themed($ocrSafeArea)} edges={["bottom"]}>
          <View style={[themed($ocrHeader), { paddingTop: insets.top }]}>
            <Text text="Tap text to use it" size="sm" weight="medium" />
            <TouchableOpacity onPress={() => setOcrOverlayVisible(false)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={$ocrScrollView}>
            <View onLayout={(e) => setImageContainerWidth(e.nativeEvent.layout.width)}>
              {scannedImages.length > 0 && (
                <>
                  <Image
                    source={{ uri: scannedImages[0].uri }}
                    style={[
                      $ocrImage,
                      {
                        aspectRatio: (scannedImages[0].width ?? 1) / (scannedImages[0].height ?? 1),
                      },
                    ]}
                    resizeMode="contain"
                  />
                  {imageContainerWidth > 0 &&
                    ocrLines.map((line, i) => {
                      const scale =
                        imageContainerWidth / (scannedImages[0].width ?? imageContainerWidth)
                      return (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.5}
                          style={[
                            themed($ocrLineHit),
                            {
                              left: line.frame.left * scale,
                              top: line.frame.top * scale,
                              width: (line.frame.right - line.frame.left) * scale,
                              height: Math.max((line.frame.bottom - line.frame.top) * scale, 20),
                            },
                          ]}
                          onPress={() => handleLineTap(line.text)}
                        />
                      )
                    })}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={themed($modalOverlay)}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        />
        <View style={themed($modalSheet)}>
          <View style={themed($modalHandle)} />
          <Text text="Select Category" preset="modalTitle" style={themed($modalTitle)} />
          {categories.map((cat, index) => (
            <ListItem
              key={cat.id}
              height={52}
              bottomSeparator={index < categories.length - 1}
              onPress={() => {
                updateReceipt(receiptId, { category: cat.id })
                setCategoryModalVisible(false)
              }}
              LeftComponent={
                <View style={$rowLeft}>
                  <View style={[$categoryDot, { backgroundColor: cat.color }]} />
                  <Text text={cat.label} size="sm" />
                </View>
              }
              RightComponent={
                category === cat.id ? (
                  <MaterialCommunityIcons name="check" size={18} color={cat.color} />
                ) : undefined
              }
            />
          ))}
        </View>
      </Modal>

      {/* Summary */}
      <Text text="Summary" preset="sectionHeading" style={themed($sectionHeading)} />
      <Card
        style={themed($cardBase)}
        ContentComponent={
          <View>
            <ListItem
              height={56}
              onPress={() =>
                handleEditField("total", "Edit Total", total?.toString() ?? "", "decimal-pad")
              }
              LeftComponent={<Text text="Total" size="sm" weight="bold" />}
              RightComponent={
                <Text
                  text={total != null ? formatCurrency(total, currency) : "—"}
                  size="md"
                  weight="bold"
                  style={$valueText}
                />
              }
            />
          </View>
        }
      />

      {/* Products */}
      {(products.length > 0 || isCategorizing) && (
        <>
          <Text text="Products" preset="sectionHeading" style={themed($sectionHeading)} />
          <Card
            style={themed($cardBase)}
            ContentComponent={
              products.length === 0 && isCategorizing ? (
                <View style={themed($productsLoader)}>
                  <ActivityIndicator size="small" color={colors.textDim} />
                </View>
              ) : (
                <View>
                  {products.map((p, index) => (
                    <ListItem
                      key={`${p.name}-${index}`}
                      height={48}
                      bottomSeparator={index < products.length - 1}
                      LeftComponent={
                        <TouchableOpacity
                          onPress={() => handleEditProductName(index)}
                          activeOpacity={0.6}
                          style={$itemLeft}
                        >
                          <Text text={p.name} size="sm" />
                        </TouchableOpacity>
                      }
                      RightComponent={
                        <TouchableOpacity
                          onPress={() => handleEditProductPrice(index)}
                          activeOpacity={0.6}
                          style={$editRow}
                        >
                          <Text
                            text={p.price != null ? formatCurrency(p.price, currency) : "—"}
                            size="sm"
                            style={[$valueText, themed($dimText)]}
                          />
                        </TouchableOpacity>
                      }
                    />
                  ))}
                </View>
              )
            }
          />
        </>
      )}

      <Button
        text="Delete Receipt"
        onPress={handleDelete}
        style={themed($deleteButton)}
        textStyle={themed($deleteButtonText)}
      />
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $actionRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xs,
})

const $actionBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
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
  marginRight: spacing.xs,
}

const $labelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $valueText: TextStyle = {
  alignSelf: "center",
  ...$tabularNums,
}

const $itemLeft: ViewStyle = {
  alignSelf: "center",
  gap: 2,
}

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $editRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $editIcon: ViewStyle = {
  marginLeft: spacing.xxs,
}

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.lg,
  backgroundColor: colors.error,
  borderColor: colors.error,
})

const $deleteButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.onDestructive,
})

const $categoryDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: spacing.xs,
}

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
})

const $modalSheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  paddingTop: spacing.sm,
})

const $modalHandle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.border,
  alignSelf: "center",
  marginBottom: spacing.md,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $ocrSafeArea: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.imageBackdrop,
})

const $ocrScrollView: ViewStyle = {
  flex: 1,
}

const $ocrHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.background,
})

const $ocrImage: ImageStyle = {
  width: "100%",
}

const $productsLoader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  alignItems: "center",
})

const $ocrLineHit: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  borderWidth: 1,
  borderColor: `${colors.accent}99`,
  backgroundColor: `${colors.accent}26`,
})
