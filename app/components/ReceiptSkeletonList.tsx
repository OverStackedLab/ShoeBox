import { FC, useEffect, useRef } from "react"
import { Animated, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

export const useSkeletonPulse = () => {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return opacity
}

interface SkeletonBlockProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export const SkeletonBlock: FC<SkeletonBlockProps> = ({
  width,
  height = 12,
  borderRadius = 4,
  style,
}) => {
  const { themed } = useAppTheme()
  const opacity = useSkeletonPulse()
  return (
    <Animated.View
      style={[themed($skeletonBlock), { width, height, borderRadius, opacity }, style]}
    />
  )
}

interface ReceiptSkeletonListProps {
  count?: number
  rowHeight?: number
}

export const ReceiptSkeletonList: FC<ReceiptSkeletonListProps> = ({
  count = 5,
  rowHeight = 72,
}) => {
  const { themed } = useAppTheme()
  const opacity = useSkeletonPulse()

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            themed($skeletonRow),
            { height: rowHeight, opacity, borderBottomWidth: i < count - 1 ? 1 : 0 },
          ]}
        >
          <View style={$leftRow}>
            <View style={themed($skeletonAvatar)} />
            <View>
              <View style={themed([$skeletonBlock, $skeletonTitle])} />
              <View style={themed([$skeletonBlock, $skeletonSubtitle])} />
            </View>
          </View>
          <View style={themed([$skeletonBlock, $skeletonAmount])} />
        </Animated.View>
      ))}
    </View>
  )
}

const $skeletonRow: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottomColor: colors.separator,
})

const $leftRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
}

const $skeletonAvatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  marginEnd: spacing.sm,
  backgroundColor: colors.separator,
})

const $skeletonBlock: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.separator,
  borderRadius: 4,
})

const $skeletonTitle: ViewStyle = {
  width: 120,
  height: 12,
  marginBottom: 6,
}

const $skeletonSubtitle: ViewStyle = {
  width: 80,
  height: 10,
}

const $skeletonAmount: ViewStyle = {
  width: 60,
  height: 12,
}
