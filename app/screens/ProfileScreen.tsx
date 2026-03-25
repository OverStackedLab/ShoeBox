import { FC, useCallback, useState } from "react"
import {
  Alert,
  LayoutAnimation,
  Modal,
  ScrollView,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import * as Application from "expo-application"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import { CATEGORY_COLORS, useCategories } from "@/context/CategoriesContext"
import { useSettings } from "@/context/SettingsContext"
import type { TabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ProfileScreenProps extends TabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = function ProfileScreen() {
  const {
    themed,
    theme: { colors },
    setThemeContextOverride,
    themeScheme,
  } = useAppTheme()
  const { authEmail, logout } = useAuth()
  const { currency, setCurrency } = useSettings()
  const { categories, addCategory, removeCategory } = useCategories()

  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)

  const themeLabel = themeScheme === "light" ? "Light" : themeScheme === "dark" ? "Dark" : "System"

  const cycleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (themeScheme === undefined) {
      setThemeContextOverride("light")
    } else if (themeScheme === "light") {
      setThemeContextOverride("dark")
    } else {
      setThemeContextOverride(undefined)
    }
  }, [themeScheme, setThemeContextOverride])

  const handleAddCategory = useCallback(async () => {
    const label = newLabel.trim()
    if (!label) return
    setIsSaving(true)
    await addCategory(label, newColor)
    setIsSaving(false)
    setNewLabel("")
    setNewColor(CATEGORY_COLORS[0])
  }, [newLabel, newColor, addCategory])

  const handleDeleteCategory = useCallback(
    (id: string, label: string) => {
      Alert.alert("Delete Category", `Remove "${label}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeCategory(id) },
      ])
    },
    [removeCategory],
  )

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <Header title="Profile" titleMode="flex" safeAreaEdges={[]} />

      {/* User Info */}
      <Card
        style={[themed($card), themed($userInfoCard)]}
        ContentComponent={
          <View style={$userInfo}>
            <View style={$avatar}>
              <MaterialCommunityIcons name="account" size={90} color="#FFFFFF" />
            </View>
            {authEmail ? (
              <Text text={authEmail} size="sm" style={themed($email)} />
            ) : (
              <View style={$noEmailRow}>
                <Text text="email@domain.com" size="sm" style={themed($email)} />
              </View>
            )}
          </View>
        }
      />

      {/* Settings */}
      <Text text="Settings" size="sm" weight="bold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($card)}
        ContentComponent={
          <>
            <ListItem
              text="Theme"
              bottomSeparator
              onPress={cycleTheme}
              RightComponent={
                <View style={$rightRow}>
                  <Text text={themeLabel} size="sm" style={themed($rightText)} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
                </View>
              }
            />
            <ListItem
              text="Currency"
              bottomSeparator
              onPress={() => setCurrency(currency === "USD" ? "HUF" : "USD")}
              RightComponent={
                <View style={$rightRow}>
                  <Text
                    text={currency === "USD" ? "USD ($)" : "HUF (Ft)"}
                    size="sm"
                    style={themed($rightText)}
                  />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
                </View>
              }
            />
            <ListItem
              text="Categories"
              onPress={() => setManageCategoriesVisible(true)}
              RightComponent={
                <View style={$rightRow}>
                  <Text text={`${categories.length} total`} size="sm" style={themed($rightText)} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
                </View>
              }
            />
          </>
        }
      />

      {/* App Info */}
      <Text text="App Info" size="sm" weight="semiBold" uppercase style={themed($sectionHeading)} />
      <Card
        style={themed($card)}
        ContentComponent={
          <>
            <ListItem
              text="Version"
              bottomSeparator
              RightComponent={
                <Text
                  text={Application.nativeApplicationVersion ?? "—"}
                  size="sm"
                  style={themed($rightText)}
                />
              }
            />
            <ListItem
              text="Build"
              RightComponent={
                <Text
                  text={Application.nativeBuildVersion ?? "—"}
                  size="sm"
                  style={themed($rightText)}
                />
              }
            />
          </>
        }
      />

      {/* Account */}
      <Text text="Account" size="sm" weight="semiBold" uppercase style={themed($sectionHeading)} />
      <Button
        preset="filled"
        text="Sign Out"
        onPress={logout}
        style={$signOutButton}
        textStyle={$signOutText}
      />

      {/* Manage Categories Modal */}
      <Modal
        visible={manageCategoriesVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setManageCategoriesVisible(false)}
      >
        <TouchableOpacity
          style={$modalOverlay}
          activeOpacity={1}
          onPress={() => setManageCategoriesVisible(false)}
        />
        <View style={themed($modalSheet)}>
          <View style={themed($modalHandle)} />
          <Text text="Categories" size="md" weight="bold" style={themed($modalTitle)} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category list */}
            <View style={themed($categoryList)}>
              {categories.map((cat, index) => (
                <View
                  key={cat.id}
                  style={[
                    themed($categoryRow),
                    index < categories.length - 1 && themed($categoryRowBorder),
                  ]}
                >
                  <View style={[$dot, { backgroundColor: cat.color }]} />
                  <Text text={cat.label} size="sm" style={$categoryLabel} />
                  {cat.isCustom ? (
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(cat.id, cat.label)}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={colors.textDim}
                      />
                    </TouchableOpacity>
                  ) : (
                    <MaterialCommunityIcons name="lock-outline" size={16} color={colors.textDim} />
                  )}
                </View>
              ))}
            </View>

            {/* New category form */}
            <View style={themed($newCategorySection)}>
              <Text
                text="New Category"
                size="sm"
                weight="semiBold"
                style={themed($newCategoryTitle)}
              />
              <TextInput
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Category name"
                placeholderTextColor={colors.textDim}
                style={themed($labelInput)}
                maxLength={30}
              />
              <View style={$colorSwatches}>
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setNewColor(color)}
                    style={[$swatch, { backgroundColor: color }]}
                  >
                    {newColor === color && (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Button
                text={isSaving ? "Saving…" : "Add Category"}
                preset="reversed"
                style={themed($addButton)}
                disabled={!newLabel.trim() || isSaving}
                onPress={handleAddCategory}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  marginBottom: spacing.xs,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $userInfo: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
  gap: 12,
}

const $avatar: ViewStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E8981E",
}

const $email: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $rightRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  gap: 4,
}

const $rightText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  alignSelf: "center",
})

const $userInfoCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 0,
  backgroundColor: colors.background,
})

const $noEmailRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $signOutButton: ViewStyle = {
  borderRadius: 8,
  backgroundColor: "#E8981E",
}

const $signOutText: TextStyle = {
  color: "#FFFFFF",
}

const $sectionHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.lg,
  marginBottom: spacing.xs,
  marginLeft: spacing.xs,
})

const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
}

const $modalSheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xl,
  maxHeight: "85%",
})

const $modalHandle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.border,
  alignSelf: "center",
  marginTop: 8,
  marginBottom: 4,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginVertical: spacing.sm,
})

const $categoryList: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  marginBottom: spacing.md,
})

const $categoryRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  paddingVertical: 10,
})

const $categoryRowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $dot: ViewStyle = {
  width: 12,
  height: 12,
  borderRadius: 6,
  flexShrink: 0,
}

const $categoryLabel: TextStyle = {
  flex: 1,
}

const $newCategorySection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.md,
  gap: spacing.sm,
  marginBottom: spacing.md,
})

const $newCategoryTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxs,
})

const $labelInput: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  color: colors.text,
  fontSize: 14,
})

const $colorSwatches: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
}

const $swatch: ViewStyle = {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
}

const $addButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxs,
})
