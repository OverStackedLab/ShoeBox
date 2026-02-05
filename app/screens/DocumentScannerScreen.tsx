import { FC, useState } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import {
  launchScanner,
  type ImageObject,
  type ScanResult,
} from "@dariyd/react-native-document-scanner"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { DemoTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useHeader } from "@/utils/useHeader"

interface DocumentScannerProps extends DemoTabScreenProps<"Home"> {}

export const DocumentScanner: FC<DocumentScannerProps> = function DocumentScanner(_props) {
  const { themed } = useAppTheme()
  const [scannedImages, setScannedImages] = useState<ImageObject[]>([])
  const [error, setError] = useState<string | null>(null)

  useHeader({
    title: "Scanner",
  })

  async function handleScan() {
    setError(null)

    try {
      const result: ScanResult = await launchScanner({
        quality: 0.8,
        includeBase64: false,
      })

      if (result.didCancel) {
        console.log("User cancelled document scan")
        return
      }

      if (result.error) {
        setError(result.errorMessage ?? "An error occurred while scanning")
        return
      }

      if (result.images && result.images.length > 0) {
        setScannedImages(result.images)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch scanner")
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["bottom"]}>
      <View style={themed($contentContainer)}>
        <Text preset="heading" style={themed($title)}>
          Receipt Scanner
        </Text>

        <Text style={themed($description)}>
          Scan your receipts to automatically track your expenses and organize your documents.
        </Text>

        {error && (
          <View style={themed($errorContainer)}>
            <Text style={themed($errorText)}>{error}</Text>
          </View>
        )}

        {scannedImages.length > 0 && (
          <View style={themed($imagesContainer)}>
            <Text preset="subheading" style={themed($imagesTitle)}>
              Scanned Documents ({scannedImages.length})
            </Text>
            {scannedImages.map((image, index) => (
              <View key={index} style={themed($imageWrapper)}>
                <Image
                  source={{ uri: image.uri }}
                  style={themed($scannedImage)}
                  resizeMode="contain"
                />
                <Text style={themed($imageInfo)}>
                  {image.width} x {image.height} • {(image.fileSize / 1024).toFixed(1)} KB
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          preset="default"
          text={scannedImages.length > 0 ? "Scan Another" : "Start Scanning"}
          onPress={handleScan}
          style={themed($scanButton)}
        />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.errorBackground,
  padding: spacing.md,
  borderRadius: 8,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $imagesContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $imagesTitle: ThemedStyle<TextStyle> = () => ({})

const $imageWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: colors.palette.neutral200,
  padding: spacing.xs,
  gap: spacing.xs,
})

const $scannedImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: 300,
  borderRadius: 8,
})

const $imageInfo: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  fontSize: 12,
})

const $scanButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})
