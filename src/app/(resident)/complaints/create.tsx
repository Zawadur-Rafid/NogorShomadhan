import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LocationPickerMap from '../../../components/LocationPickerMap';
import * as ImagePicker from 'expo-image-picker';
import { categorizeComplaint } from '../../../services/ai.service';
import { createComplaint } from '../../../services/resident.service';
import { ActivityIndicator } from 'react-native';
export default function NewComplaintForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [photos, setPhotos] = useState<{uri: string, base64: string}[]>([]);
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    location: false,
    photos: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClearLocation = () => {
    setSelectedLocation(null);
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to capture photos of the issue.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setPhotos(prev => [...prev, { uri: asset.uri, base64: asset.base64! }]);
          if (errors.photos) setErrors(prev => ({ ...prev, photos: false }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setPhotos(prev => [...prev, { uri: asset.uri, base64: asset.base64! }]);
          if (errors.photos) setErrors(prev => ({ ...prev, photos: false }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: title.trim() === '',
      description: description.trim() === '',
      location: selectedLocation === null,
      photos: photos.length === 0,
    };
    setErrors(newErrors);

    if (!newErrors.title && !newErrors.description && !newErrors.location && !newErrors.photos) {
      setIsSubmitting(true);
      try {
        const base64Images = photos.map(p => p.base64);

        const category = await categorizeComplaint(title, description, base64Images);

        await createComplaint({
          title,
          description,
          latitude: selectedLocation!.lat,
          longitude: selectedLocation!.lng,
          category,
          images: photos,
        });

        Alert.alert(
          'Submission Successful', 
          `Your complaint has been logged as "${category}" and queued for review.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setTitle('');
                setDescription('');
                setSelectedLocation(null);
                setPhotos([]);
                setErrors({ title: false, description: false, location: false, photos: false });
              }
            }
          ]
        );
      } catch (error: any) {
        console.error("Submission error:", error);
        Alert.alert('Submission Failed', error.message || 'An error occurred while submitting.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      
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
            if (errors.title) setErrors(prev => ({ ...prev, title: false }));
          }}
        />
        {errors.title && <Text style={styles.errorText}>This field is required</Text>}
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
            if (errors.description) setErrors(prev => ({ ...prev, description: false }));
          }}
        />
        {errors.description && <Text style={styles.errorText}>This field is required</Text>}
      </View>

      {/* Location Picker */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <Text style={styles.label}>INCIDENT LOCATION</Text>
          {selectedLocation && (
            <TouchableOpacity style={styles.detectButton} onPress={handleClearLocation}>
              <MaterialIcons name="clear" size={16} color="#EF4444" />
              <Text style={[styles.detectText, { color: '#EF4444' }]}>CLEAR LOCATION</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.mapPlaceholder}>
          <LocationPickerMap 
            selectedLocation={selectedLocation} 
            onLocationSelect={(loc: {lat: number, lng: number} | null) => {
              setSelectedLocation(loc);
              if (errors.location) setErrors(prev => ({ ...prev, location: false }));
            }} 
          />
        </View>
        {selectedLocation && (
          <Text style={styles.coordinatesText}>
            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </Text>
        )}
        {errors.location && <Text style={styles.errorText}>This field is required</Text>}
      </View>

      {/* Photo Upload */}
      <View style={styles.card}>
        <Text style={styles.label}>ATTACH PHOTOS</Text>
        <View style={styles.photoGrid}>
          <TouchableOpacity style={styles.photoButton} onPress={handleCamera}>
            <MaterialIcons name="add-a-photo" size={28} color="#6B7280" />
            <Text style={styles.photoButtonText}>CAMERA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={handleGallery}>
            <MaterialIcons name="image" size={28} color="#6B7280" />
            <Text style={styles.photoButtonText}>GALLERY</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.selectedPhotosGrid}>
            {photos.map((photo, idx) => (
              <View key={`${photo.uri}-${idx}`} style={styles.photoPreviewWrapper}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(idx)}>
                  <MaterialIcons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {errors.photos && <Text style={styles.errorText}>At least one photo attachment is required</Text>}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#23435D',
    marginBottom: 12,
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#00475E',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40484D',
    fontFamily: 'Inter',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40484D',
    fontFamily: 'Inter',
  },
  urgencyTextSelected: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter',
    minHeight: 100,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  detectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  mapPlaceholder: {
    width: '100%',
    height: 260,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  selectedPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  photoPreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#00475E',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 4,
  }
});
