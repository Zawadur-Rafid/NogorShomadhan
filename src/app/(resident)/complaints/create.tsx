import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LocationPickerMap from '../../../components/LocationPickerMap';
import * as ImagePicker from 'expo-image-picker';



export default function NewComplaintForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const handleClearLocation = () => {
    setSelectedLocation(null);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need media library permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
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
          onChangeText={setTitle}
        />
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
          onChangeText={setDescription}
        />
      </View>

      {/* Location Picker */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <Text style={styles.label}>INCIDENT LOCATION</Text>
          <TouchableOpacity style={styles.detectButton} onPress={handleClearLocation}>
            <MaterialIcons name="clear" size={16} color="#EF4444" />
            <Text style={[styles.detectText, { color: '#EF4444' }]}>CLEAR LOCATION</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapPlaceholder}>
          <LocationPickerMap 
            selectedLocation={selectedLocation} 
            onLocationSelect={setSelectedLocation} 
          />
        </View>
        {selectedLocation && (
          <Text style={styles.coordinatesText}>
            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </Text>
        )}
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
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoPreviewWrapper}>
                <Image source={{ uri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(idx)}>
                  <MaterialIcons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
        <MaterialIcons name="send" size={20} color="#FFF" />
        <Text style={styles.submitText}>SUBMIT COMPLAINT</Text>
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
    backgroundColor: 'rgba(35, 67, 93, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  detectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#23435D',
    fontFamily: 'Inter',
  },
  mapPlaceholder: {
    width: '100%',
    height: 300,
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
    backgroundColor: '#23435D',
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
  }
});
