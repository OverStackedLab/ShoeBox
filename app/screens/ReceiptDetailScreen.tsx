import { FC } from "react"
import { Image, ImageStyle, ScrollView, ViewStyle } from "react-native"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ReceiptDetailScreenProps extends AppStackScreenProps<"ReceiptDetail"> {}

export const ReceiptDetailScreen: FC<ReceiptDetailScreenProps> = function ReceiptDetailScreen({
  route,
  navigation,
}) {
  const { themed } = useAppTheme()
  const { receiptId, scannedImages } = route.params

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={themed($screenContainer)}
      safeAreaEdges={["top"]}
    >
      <Header
        title="Receipt Detail"
        titleMode="flex"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        safeAreaEdges={[]}
      />

      {scannedImages && scannedImages.length > 0 ? (
        <ScrollView
          contentContainerStyle={themed($imageList)}
          showsVerticalScrollIndicator={false}
        >
          {scannedImages.map((img, index) => (
            <Image
              key={`${receiptId}-${index}`}
              source={{ uri: img.uri }}
              style={[$image, { aspectRatio: img.width / img.height }]}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
      ) : (
        <>
          <Text text={`Receipt #${receiptId}`} preset="heading" />
          <Text text="No scanned images available." size="sm" />
        </>
      )}
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $imageList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  paddingBottom: spacing.xl,
})

const $image: ImageStyle = {
  width: "100%",
  borderRadius: 12,
}
