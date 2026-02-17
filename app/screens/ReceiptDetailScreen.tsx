import { FC } from "react"
import { ViewStyle } from "react-native"

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
  const { receiptId } = route.params

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
      />
      <Text text={`Receipt #${receiptId}`} preset="heading" />
      <Text text="Detail view coming soon..." size="sm" />
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})
