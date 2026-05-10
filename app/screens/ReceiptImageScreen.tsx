import { FC, useEffect, useState } from "react"
import {
  Alert,
  Image,
  ImageStyle,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { toast } from "sonner-native"

import { Text } from "@/components/Text"
import { useReceipts } from "@/context/ReceiptsContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface OcrLine {
  text: string
  frame: { left: number; top: number; right: number; bottom: number }
}

interface ReceiptImageScreenProps extends AppStackScreenProps<"ReceiptImage"> {}

export const ReceiptImageScreen: FC<ReceiptImageScreenProps> = function ReceiptImageScreen({
  route,
  navigation,
}) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const { receipts, updateReceipt } = useReceipts()
  const { receiptId } = route.params

  const stored = receipts.find((r) => r.id === receiptId)
  const scannedImages = stored?.scannedImages ?? []
  const firstImage = scannedImages[0]

  const [ocrLines, setOcrLines] = useState<OcrLine[]>([])
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!firstImage) return
    let cancelled = false
    recognizeText(firstImage.uri)
      .then((result) => {
        if (cancelled) return
        setOcrLines(result.blocks.flatMap((b) => b.lines))
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not read receipt text.")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstImage?.uri])

  const handleLineTap = (text: string) => {
    Alert.alert(text, "Apply as:", [
      {
        text: "Merchant",
        onPress: () => {
          updateReceipt(receiptId, { storeName: text })
          navigation.goBack()
        },
      },
      {
        text: "Address",
        onPress: () => {
          updateReceipt(receiptId, { address: text })
          navigation.goBack()
        },
      },
      {
        text: "Date",
        onPress: () => {
          updateReceipt(receiptId, { date: text })
          navigation.goBack()
        },
      },
      {
        text: "Total",
        onPress: () => {
          const n = parseFloat(text.replace(/[^0-9.]/g, ""))
          if (!isNaN(n)) {
            updateReceipt(receiptId, { total: n })
            navigation.goBack()
          } else {
            Alert.alert("Invalid", `"${text}" is not a valid amount.`)
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  return (
    <SafeAreaView style={themed($safeArea)} edges={["bottom"]}>
      <View style={[themed($header), { paddingTop: insets.top }]}>
        <Text text="Tap text to use it" size="sm" weight="medium" />
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={$scroll}>
        <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          {firstImage && (
            <>
              <Image
                source={{ uri: firstImage.uri }}
                style={[
                  $image,
                  { aspectRatio: (firstImage.width ?? 1) / (firstImage.height ?? 1) },
                ]}
                resizeMode="contain"
              />
              {containerWidth > 0 &&
                ocrLines.map((line, i) => {
                  const scale = containerWidth / (firstImage.width ?? containerWidth)
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.5}
                      style={[
                        themed($lineHit),
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
  )
}

const $safeArea: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $scroll: ViewStyle = { flex: 1 }

const $image: ImageStyle = { width: "100%" }

const $lineHit: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  backgroundColor: colors.accentBackground,
  opacity: 0.35,
  borderRadius: 4,
})
