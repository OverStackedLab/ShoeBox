import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import {
  launchDocumentScannerAsync,
  ResultFormatOptions,
} from "@infinitered/react-native-mlkit-document-scanner"

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

  useHeader({
    title: "Scanner",
  })

  function handleScan() {
    // TODO: Implement scan functionality
    console.log("Scan button pressed")
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

        {/* <View style={themed($scanArea)}>
          <Text style={themed($scanPlaceholder)}>Camera view will appear here</Text>
        </View> */}
        <View>
          <Button
            preset="default"
            text="Start Scanning"
            onPress={async () => {
              // result will contain an object with the result information
              const result = await launchDocumentScannerAsync({
                pageLimit: 1,
                galleryImportAllowed: false,
                resultFormats: ResultFormatOptions.ALL,
              })
            }}
            style={themed($scanButton)}
          />
        </View>
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

const $scanArea: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 400,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  marginTop: spacing.md,
})

const $scanPlaceholder: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $scanButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})
