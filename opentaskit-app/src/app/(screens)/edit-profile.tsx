import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ChevronLeft,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { resolveImageSource } from '@/utils/images';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField, TextArea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { BottomSheet } from '@/components/ui/Overlay';
import type { PortfolioItem } from '@/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me, updateMe, toast } = useApp();

  const [name, setName] = useState(me.name);
  const [headline, setHeadline] = useState(me.headline);
  const [about, setAbout] = useState(me.about);
  const [skills, setSkills] = useState<string[]>(me.skills);
  const [newSkill, setNewSkill] = useState('');
  const [services, setServices] = useState(me.services);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(me.portfolio);

  // New Service Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [serviceError, setServiceError] = useState('');

  // New Portfolio Item Modal
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [portfolioImageUri, setPortfolioImageUri] = useState<string | null>(null);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioError, setPortfolioError] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to change your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        toast({ title: 'Photo selected', description: 'Avatar photo updated.', variant: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast({ title: 'Skill already added', variant: 'info' });
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) {
      setServiceError('Enter a service name');
      return;
    }
    const priceNum = Number(newServicePrice);
    if (!priceNum || priceNum < 500) {
      setServiceError('Enter a valid starting rate (min Rs 500)');
      return;
    }
    setServices((prev) => [...prev, { name: newServiceName.trim(), from: priceNum }]);
    setNewServiceName('');
    setNewServicePrice('');
    setServiceError('');
    setServiceModalOpen(false);
    toast({ title: 'Service added', variant: 'success' });
  };

  const handleRemoveService = (indexToRemove: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePickPortfolioImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to upload project images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPortfolioImageUri(result.assets[0].uri);
        setPortfolioModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePortfolioItem = () => {
    if (!portfolioTitle.trim()) {
      setPortfolioError('Enter a project title');
      return;
    }
    if (!portfolioImageUri) return;

    setPortfolio((prev) => [
      ...prev,
      {
        id: `pf-${Date.now()}`,
        title: portfolioTitle.trim(),
        image: portfolioImageUri,
      },
    ]);
    setPortfolioTitle('');
    setPortfolioImageUri(null);
    setPortfolioError('');
    setPortfolioModalOpen(false);
    toast({ title: 'Project added to portfolio', variant: 'success' });
  };

  const handleRemovePortfolioItem = (idToRemove: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = 'Enter your full name (at least 3 characters)';
    if (about.trim().length < 30) next.about = 'Tell people a little more about your work (at least 30 characters)';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      updateMe({
        name: name.trim(),
        headline: headline.trim(),
        about: about.trim(),
        skills,
        services,
        portfolio,
      });
      setSaving(false);
      toast({ title: 'Profile updated', variant: 'success' });
      router.back();
    }, 700);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Edit profile" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-5 px-5 pb-8 pt-4" style={{ gap: 20 }}>
            {/* Avatar & Photo Action */}
            <View className="items-center py-2">
              <Avatar user={{ ...me, name }} size="xl" />
              <Pressable
                onPress={handlePickAvatar}
                hitSlop={10}
                className="mt-2.5 flex-row items-center gap-1.5 py-1 px-3 rounded-full active:bg-ink-100"
              >
                <Camera size={15} color="#0094F7" />
                <Text className="font-geist-medium text-[13px] text-brand">
                  Change photo
                </Text>
              </Pressable>
            </View>

            {/* Basic Info Fields */}
            <View className="gap-4" style={{ gap: 16 }}>
              <TextField
                label="Full name"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                error={errors.name}
              />

              <TextField
                label="Headline"
                value={headline}
                onChangeText={setHeadline}
                hint="Shown under your name on offers and your profile."
              />

              <TextArea
                label="About"
                value={about}
                onChangeText={(val) => {
                  setAbout(val);
                  if (errors.about) setErrors((prev) => ({ ...prev, about: '' }));
                }}
                error={errors.about}
              />
            </View>

            {/* Skills Section */}
            <View>
              <Text className="mb-2 text-[13px] font-geist-medium text-ink-700">
                Skills
              </Text>
              <View className="flex-row flex-wrap gap-2" style={{ gap: 8 }}>
                {skills.map((skill) => (
                  <View
                    key={skill}
                    className="flex-row items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1.5 pl-3 pr-2"
                    style={{ gap: 6 }}
                  >
                    <Text className="font-geist text-[13px] text-ink-700">
                      {skill}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveSkill(skill)}
                      hitSlop={8}
                      className="h-5 w-5 items-center justify-center rounded-full active:bg-ink-100"
                    >
                      <X size={13} color="#8A959B" />
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Add Skill Input Row */}
              <View className="mt-3 flex-row items-center gap-2" style={{ gap: 8 }}>
                <TextInput
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add a skill (e.g. Painting, Plumbing)"
                  placeholderTextColor="#8A959B"
                  onSubmitEditing={handleAddSkill}
                  returnKeyType="done"
                  style={[{ fontFamily: 'Geist-Regular' }]}
                  className="h-11 flex-1 rounded-2xl border border-ink-200 bg-white px-4 text-[14px] font-geist text-ink"
                />
                <Button
                  size="md"
                  variant="outline"
                  icon={<Plus size={16} color="#0C1417" />}
                  onPress={handleAddSkill}
                >
                  Add
                </Button>
              </View>
            </View>

            {/* Services & Rates Section */}
            <View>
              <Text className="mb-2 text-[13px] font-geist-medium text-ink-700">
                Services & rates
              </Text>
              <View className="divide-y divide-ink-100 rounded-3xl border border-ink-200 bg-white px-4">
                {services.map((service, idx) => (
                  <View
                    key={`${service.name}-${idx}`}
                    className="flex-row items-center justify-between py-3.5"
                  >
                    <View className="flex-1 min-w-0 mr-2">
                      <Text
                        numberOfLines={1}
                        className="font-geist text-[14px] text-ink"
                      >
                        {service.name}
                      </Text>
                      <Text className="mt-0.5 font-geist-medium text-[12.5px] text-ink-500">
                        from {money(service.from)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleRemoveService(idx)}
                      hitSlop={8}
                      className="h-8 w-8 items-center justify-center rounded-full active:bg-danger/10"
                    >
                      <Trash2 size={15} color="#C7382F" />
                    </Pressable>
                  </View>
                ))}
              </View>

              <View className="mt-2.5">
                <Button
                  size="md"
                  variant="ghost"
                  icon={<Plus size={16} color="#0094F7" />}
                  onPress={() => setServiceModalOpen(true)}
                >
                  Add a service
                </Button>
              </View>
            </View>

            {/* Portfolio Section */}
            <View>
              <Text className="mb-2 text-[13px] font-geist-medium text-ink-700">
                Portfolio
              </Text>
              <View className="flex-row flex-wrap gap-2.5" style={{ gap: 10 }}>
                {portfolio.map((item) => (
                  <View
                    key={item.id}
                    className="relative aspect-square w-[30.5%] overflow-hidden rounded-2xl border border-ink-200 bg-white"
                  >
                    <Image
                      source={resolveImageSource(item.image)}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => handleRemovePortfolioItem(item.id)}
                      hitSlop={8}
                      className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-ink/75 active:bg-ink"
                    >
                      <X size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </Pressable>
                    <View className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <Text
                        numberOfLines={1}
                        className="text-[10px] font-geist-medium text-white"
                      >
                        {item.title}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Add Portfolio Card Button */}
                <Pressable
                  onPress={handlePickPortfolioImage}
                  className="aspect-square w-[30.5%] items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white active:bg-ink-100"
                >
                  <Plus size={20} color="#5B6A72" />
                  <Text className="mt-1 font-geist-medium text-[11.5px] text-ink-500">
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Profile Completion Chips */}
            <View className="flex-row flex-wrap gap-2 pt-1" style={{ gap: 8 }}>
              <Chip tone="brand">Profile 85% complete</Chip>
              <Chip tone="neutral">Add 1 more portfolio item</Chip>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View
          className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
        >
          <Button
            full
            size="lg"
            variant="brand"
            loading={saving}
            onPress={handleSave}
          >
            Save changes
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* MODAL: Add New Service Bottom Sheet */}
      <BottomSheet
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Add a service"
        description="List tasks you offer and your minimum baseline fee."
        footer={
          <Button full size="lg" variant="brand" onPress={handleAddService}>
            Add service
          </Button>
        }
      >
        <View className="gap-3.5 pb-2" style={{ gap: 14 }}>
          <TextField
            label="Service name"
            value={newServiceName}
            onChangeText={(val) => {
              setNewServiceName(val);
              if (serviceError) setServiceError('');
            }}
            placeholder="e.g. Ceiling fan installation"
          />

          <View>
            <Text className="mb-1.5 text-[13px] font-geist-medium text-ink-700">
              Starting rate (from)
            </Text>
            <View className="flex-row items-center rounded-2xl border border-ink-200 bg-white px-4 h-[52px]">
              <Text className="mr-2 text-[16px] font-geist-semibold text-ink-400">
                Rs
              </Text>
              <TextInput
                value={newServicePrice}
                onChangeText={(val) => {
                  setNewServicePrice(val.replace(/\D/g, ''));
                  if (serviceError) setServiceError('');
                }}
                placeholder="2500"
                placeholderTextColor="#8A959B"
                keyboardType="numeric"
                style={[{ fontFamily: 'Geist-SemiBold' }]}
                className="flex-1 text-[18px] font-geist-semibold text-ink"
              />
            </View>
          </View>

          {serviceError && (
            <Text className="text-[12px] font-geist-medium text-danger">
              {serviceError}
            </Text>
          )}
        </View>
      </BottomSheet>

      {/* MODAL: Add Portfolio Item Title Bottom Sheet */}
      <BottomSheet
        open={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        title="Add to portfolio"
        description="Give your project photo a descriptive title."
        footer={
          <Button full size="lg" variant="brand" onPress={handleSavePortfolioItem}>
            Add project
          </Button>
        }
      >
        <View className="gap-3.5 pb-2" style={{ gap: 14 }}>
          {portfolioImageUri && (
            <View className="h-36 w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-900">
              <Image
                source={{ uri: portfolioImageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
          )}

          <TextField
            label="Project title"
            value={portfolioTitle}
            onChangeText={(val) => {
              setPortfolioTitle(val);
              if (portfolioError) setPortfolioError('');
            }}
            placeholder="e.g. Modern kitchen cabinet installation"
            error={portfolioError}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
