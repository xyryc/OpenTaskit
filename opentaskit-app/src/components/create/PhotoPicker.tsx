import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Camera, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

export interface PhotoPickerProps {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (src: string) => void;
  onAddImages?: (uris: string[]) => void;
}

export function PhotoPicker({
  open,
  onClose,
  selected,
  onToggle,
  onAddImages,
}: PhotoPickerProps) {
  const [loadingAction, setLoadingAction] = useState<'camera' | 'library' | null>(null);

  const handleTakePhoto = async () => {
    try {
      setLoadingAction('camera');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow access to your camera in device settings to take photos for your task.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (onAddImages) {
          onAddImages([uri]);
        } else {
          onToggle(uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUploadFile = async () => {
    try {
      setLoadingAction('library');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photos Permission Required',
          'Please allow access to your photos in device settings to upload images for your task.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        if (onAddImages) {
          onAddImages(uris);
        } else {
          uris.forEach((uri) => onToggle(uri));
        }
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      Alert.alert('Error', 'Unable to open photos gallery. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add photos"
      description="Photos help people understand the job and send accurate offers."
      footer={
        <Button full variant="brand" onPress={onClose}>
          {`Done (${selected.length})`}
        </Button>
      }
    >
      {/* Quick Action Buttons */}
      <View className="flex-row gap-2.5 pb-2" style={{ gap: 10 }}>
        <Pressable
          onPress={handleTakePhoto}
          disabled={loadingAction !== null}
          className="flex-1 items-center rounded-2xl border border-dashed border-ink-300 py-6 active:bg-ink-100"
        >
          {loadingAction === 'camera' ? (
            <ActivityIndicator size="small" color="#2B3A41" />
          ) : (
            <Camera size={24} color="#2B3A41" />
          )}
          <Text className="mt-2 font-geist-medium text-[13px] text-ink-700">
            Take photo
          </Text>
        </Pressable>

        <Pressable
          onPress={handleUploadFile}
          disabled={loadingAction !== null}
          className="flex-1 items-center rounded-2xl border border-dashed border-ink-300 py-6 active:bg-ink-100"
        >
          {loadingAction === 'library' ? (
            <ActivityIndicator size="small" color="#2B3A41" />
          ) : (
            <ImagePlus size={24} color="#2B3A41" />
          )}
          <Text className="mt-2 font-geist-medium text-[13px] text-ink-700">
            Upload file
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
