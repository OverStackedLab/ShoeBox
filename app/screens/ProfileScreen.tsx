import { FC, useCallback, useState } from "react"
import {
  Alert,
  ImageStyle,
  LayoutAnimation,
  Modal,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import * as Application from "expo-application"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { CATEGORY_COLORS, useCategories } from "@/context/CategoriesContext"
import { useSettings } from "@/context/SettingsContext"
import type { TabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

interface ProfileScreenProps extends TabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = function ProfileScreen() {
  const {
    themed,
    theme: { colors },
    setThemeContextOverride,
    themeScheme,
  } = useAppTheme()
  const { authEmail, avatarUrl, logout, uploadAvatar } = useAuth()
  const { currency, setCurrency } = useSettings()
  const { categories, addCategory, removeCategory } = useCategories()

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(undefined)
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false)

  const displayAvatarUrl = localAvatarUrl ?? avatarUrl

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo access to change your avatar.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })
    if (result.canceled || !result.assets[0].base64) return
    const asset = result.assets[0]
    setIsUploadingAvatar(true)
    const error = await uploadAvatar(asset.base64!, asset.mimeType ?? "image/jpeg")
    setIsUploadingAvatar(false)
    if (error) {
      Alert.alert("Upload failed", error)
    } else {
      setLocalAvatarUrl(asset.uri)
    }
  }, [uploadAvatar])
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
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      {/* User Info */}
      <Card
        style={[themed($card), themed($userInfoCard)]}
        ContentComponent={
          <View style={$userInfo}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              style={$avatarWrapper}
            >
              <View style={themed($avatar)}>
                {displayAvatarUrl ? (
                  <Image source={{ uri: displayAvatarUrl }} style={$avatarImage} contentFit="cover" />
                ) : (
                  <MaterialCommunityIcons
                    name="account"
                    size={90}
                    color={colors.palette.neutral100}
                  />
                )}
              </View>
              <View style={themed($avatarEditBadge)}>
                <MaterialCommunityIcons
                  name={isUploadingAvatar ? "loading" : "camera"}
                  size={14}
                  color={colors.palette.neutral100}
                />
              </View>
            </TouchableOpacity>
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
      <Text text="Settings" preset="sectionHeading" style={themed($sectionHeading)} />
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
      <Text text="App Info" preset="sectionHeading" style={themed($sectionHeading)} />
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
      <Text text="Account" preset="sectionHeading" style={themed($sectionHeading)} />
      <Button preset="primary" text="Sign Out" onPress={logout} />

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
          <Text text="Categories" preset="modalTitle" style={themed($modalTitle)} />
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
              <TextField
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Category name"
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
                preset="primary"
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

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
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
  paddingVertical: spacing.xs,
  gap: spacing.sm,
}

const $avatarWrapper: ViewStyle = {
  width: 120,
  height: 120,
}

const $avatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 120,
  height: 120,
  borderRadius: 60,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.accent,
  overflow: "hidden",
})

const $avatarImage: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
}

const $avatarEditBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  bottom: 0,
  right: 0,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.accent,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  borderColor: colors.background,
})

const $email: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $rightRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  gap: spacing.xxs,
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
  gap: spacing.xxs,
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

const $modalHandle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.border,
  alignSelf: "center",
  marginTop: spacing.xs,
  marginBottom: spacing.xxs,
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

const $categoryRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingVertical: spacing.sm,
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
