import { confirmAction } from "@/utils/confirm";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CATEGORIES, categorizeComplaint } from "../../../services/ai.service";
import { createComplaint } from "../../../services/resident.service";
export default function NewComplaintForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [house, setHouse] = useState("");
  const [road, setRoad] = useState("");
  const [avenue, setAvenue] = useState("");
  const [nearbyLandmark, setNearbyLandmark] = useState("");
  const [additionalLocationDetails, setAdditionalLocationDetails] =
    useState("");
  const [photos, setPhotos] = useState<{ uri: string; base64: string }[]>([]);
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    location: false,
    photos: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const slideAnim = useRef(new Animated.Value(400)).current;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (title.trim().length > 5 && description.trim().length > 10) {
        setIsCategorizing(true);
        try {
          const suggestedCategory = await categorizeComplaint(
            title,
            description,
            [],
          );
          setCategory(suggestedCategory);
        } catch (error) {
          console.error("AI categorization failed", error);
        } finally {
          setIsCategorizing(false);
        }
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(handler);
  }, [title, description]);

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to capture photos of the issue.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setPhotos((prev) => [
            ...prev,
            { uri: asset.uri, base64: asset.base64! },
          ]);
          if (errors.photos) setErrors((prev) => ({ ...prev, photos: false }));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  const handleGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Media library permission is required to select photos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setPhotos((prev) => [
            ...prev,
            { uri: asset.uri, base64: asset.base64! },
          ]);
          if (errors.photos) setErrors((prev) => ({ ...prev, photos: false }));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image from gallery.");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: title.trim() === "",
      description: description.trim() === "",
      location: road.trim() === "" || avenue.trim() === "", // Simple validation: require at least road and avenue
      photos: false,
    };
    setErrors(newErrors);

    if (
      !newErrors.title &&
      !newErrors.description &&
      !newErrors.location &&
      !newErrors.photos
    ) {
      const confirmed = await confirmAction(
        "Are you sure you want to submit this complaint?",
      );
      if (!confirmed) return;

      setIsSubmitting(true);
      try {
        const base64Images = photos.map((p) => p.base64);

        const acc_id = await AsyncStorage.getItem("acc_id");

        await createComplaint({
          title,
          description,
          house: house.trim() || undefined,
          road: road.trim() || undefined,
          avenue: avenue.trim() || undefined,
          nearby_landmark: nearbyLandmark.trim() || undefined,
          additional_location_details:
            additionalLocationDetails.trim() || undefined,
          category: category || "Other",
          images: photos,
          acc_id: acc_id || undefined,
        });

        triggerToast(`Your complaint has been logged and queued for review.`);

        setTitle("");
        setDescription("");
        setHouse("");
        setRoad("");
        setAvenue("");
        setNearbyLandmark("");
        setAdditionalLocationDetails("");
        setCategory("");
        setPhotos([]);
        setErrors({
          title: false,
          description: false,
          location: false,
          photos: false,
        });
      } catch (error: any) {
        console.error("Submission error:", error);
        Alert.alert(
          "Submission Failed",
          error.message || "An error occurred while submitting.",
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.toastLeftBorder} />
          <MaterialIcons
            name="check-circle"
            size={24}
            color="#1b7a43"
            style={styles.toastIcon}
          />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Success</Text>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowToast(false)}
            style={styles.toastCloseButton}
          >
            <MaterialIcons name="close" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Field */}
          <View style={styles.card}>
            <Text style={styles.label}>COMPLAINT TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief summary (e.g., Broken streetlight)"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: false }));
              }}
            />
            {errors.title && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Description Field */}
          <View style={styles.card}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us more about the issue..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description)
                  setErrors((prev) => ({ ...prev, description: false }));
              }}
            />
            {errors.description && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Location Picker */}
          <View style={styles.card}>
            <Text style={styles.label}>INCIDENT LOCATION</Text>

            <TextInput
              style={[styles.input, styles.marginBottom]}
              placeholder="House Number (Optional)"
              placeholderTextColor="#9CA3AF"
              value={house}
              onChangeText={(text) => {
                setHouse(text);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: false }));
              }}
            />

            <TextInput
              style={[styles.input, styles.marginBottom]}
              placeholder="Road Number (Required)"
              placeholderTextColor="#9CA3AF"
              value={road}
              onChangeText={(text) => {
                setRoad(text);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: false }));
              }}
            />

            <TextInput
              style={[styles.input, styles.marginBottom]}
              placeholder="Avenue (Required)"
              placeholderTextColor="#9CA3AF"
              value={avenue}
              onChangeText={(text) => {
                setAvenue(text);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: false }));
              }}
            />

            <TextInput
              style={[styles.input, styles.marginBottom]}
              placeholder="Nearby Landmark (Optional)"
              placeholderTextColor="#9CA3AF"
              value={nearbyLandmark}
              onChangeText={setNearbyLandmark}
            />

            <TextInput
              style={styles.input}
              placeholder="Additional Details (Optional)"
              placeholderTextColor="#9CA3AF"
              value={additionalLocationDetails}
              onChangeText={setAdditionalLocationDetails}
            />

            {errors.location && (
              <Text style={styles.errorText}>
                Road Number and Avenue are required fields
              </Text>
            )}
          </View>

          {/* Photo Upload */}
          <View style={styles.card}>
            <Text style={styles.label}>ATTACH PHOTOS</Text>
            <View style={styles.photoGrid}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleCamera}
              >
                <MaterialIcons name="add-a-photo" size={28} color="#6B7280" />
                <Text style={styles.photoButtonText}>CAMERA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleGallery}
              >
                <MaterialIcons name="image" size={28} color="#6B7280" />
                <Text style={styles.photoButtonText}>GALLERY</Text>
              </TouchableOpacity>
            </View>

            {photos.length > 0 && (
              <View style={styles.selectedPhotosGrid}>
                {photos.map((photo, idx) => (
                  <View
                    key={`${photo.uri}-${idx}`}
                    style={styles.photoPreviewWrapper}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoPreview}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(idx)}
                    >
                      <MaterialIcons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.card}>
            <Text style={styles.label}>CATEGORY</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={
                  category
                    ? styles.dropdownButtonText
                    : styles.dropdownButtonPlaceholder
                }
              >
                {category || "Select a category"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
            </TouchableOpacity>

            {isCategorizing && (
              <View style={styles.aiSuggestionContainer}>
                <ActivityIndicator size="small" color="#00475E" />
                <Text style={styles.aiSuggestionText}>
                  AI is determining the best category...
                </Text>
              </View>
            )}
            {!isCategorizing && category ? (
              <View style={styles.aiSuggestionContainer}>
                <MaterialIcons name="auto-awesome" size={16} color="#00475E" />
                <Text style={styles.aiSuggestionText}>
                  Category suggested by AI. Tap above to change.
                </Text>
              </View>
            ) : null}
          </View>

          <Modal
            visible={showCategoryModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setShowCategoryModal(false)}
              activeOpacity={1}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <ScrollView style={styles.modalList}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.modalItem,
                        category === cat && styles.modalItemSelected,
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          category === cat && styles.modalItemTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#FFF" />
                <Text style={styles.submitText}>SUBMIT COMPLAINT</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#23435D",
    marginBottom: 12,
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    fontSize: 16,
    color: "#374151",
    fontFamily: "System",
  },
  marginBottom: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: "#00475E",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#40484D",
    fontFamily: "System",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  urgencyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#40484D",
    fontFamily: "System",
  },
  urgencyTextSelected: {
    color: "#FFFFFF",
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#374151",
    fontFamily: "System",
    minHeight: 100,
  },
  photoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  photoButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 8,
    fontFamily: "System",
  },
  selectedPhotosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  photoPreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#00475E",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "System",
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "System",
  },
  dropdownButtonPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    fontFamily: "System",
  },
  aiSuggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  aiSuggestionText: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "System",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "85%",
    maxHeight: "70%",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#23435D",
    marginBottom: 12,
    fontFamily: "System",
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#F0F9FF",
  },
  modalItemText: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "System",
  },
  modalItemTextSelected: {
    color: "#00475E",
    fontWeight: "600",
  },
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 16,
    width: 320,
    backgroundColor: "#ebf4ec",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingRight: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  toastLeftBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#1b7a43",
  },
  toastIcon: {
    marginLeft: 16,
    marginTop: 0,
  },
  toastContent: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  toastText: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "400",
    color: "#2a2a2a",
    lineHeight: 20,
  },
  toastCloseButton: {
    padding: 2,
    marginLeft: 8,
  },
});
