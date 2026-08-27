import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Banknote,
  Camera,
  Check,
  ChevronLeft,
  CreditCard,
  Lock,
  MapPin,
  Plus,
  Wallet2,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { categories } from '@/data/categories';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField, TextArea, Toggle } from '@/components/ui/Input';
import { SelectChip } from '@/components/ui/Chip';
import { StepProgress } from '@/components/ui/Segmented';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PhotoPicker } from '@/components/create/PhotoPicker';
import { LocationPicker } from '@/components/create/LocationPicker';
import { PAYMENT_METHODS, walletCovers } from '@/utils/payment';
import { money } from '@/utils/format';
import type { PaymentMethod } from '@/types';

const steps = ['Basics', 'Photos', 'Location', 'Budget & payment', 'Schedule', 'Review'];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const PRESET_AMOUNTS = [3000, 5000, 8000, 12000, 20000];

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAccount, currentLocation, wallet, toast } = useApp();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState(
    currentLocation === 'Location off' ? '' : currentLocation
  );
  const [budget, setBudget] = useState('');
  const [flexible, setFlexible] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoOpen, setPhotoOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Require account for posting
  useEffect(() => {
    if (!requireAccount('post')) {
      router.replace('/home');
    }
  }, [requireAccount, router]);

  // Categories in rows of 3
  const categoryRows = useMemo(() => chunkArray(categories, 3), []);

  // Photo grid items in rows of 3
  const photoRows = useMemo(() => {
    const items = [
      ...images.map((src, index) => ({ type: 'image' as const, src, index })),
      { type: 'add' as const },
    ];
    return chunkArray(items, 3);
  }, [images]);

  const budgetValue = Number(budget) || 0;
  const walletAvailable = walletCovers(wallet.available, budgetValue);

  const validate = (target: number) => {
    const next: Record<string, string> = {};
    if (target > 1) {
      if (title.trim().length < 8) {
        next.title = 'Give your task a clear title (at least 8 characters)';
      }
      if (!categoryId) {
        next.categoryId = 'Pick the closest category';
      }
      if (description.trim().length < 20) {
        next.description = 'Add a few details so offers are accurate (minimum 20 characters)';
      }
    }
    if (target > 3 && !location.trim()) {
      next.location = 'Set where the task happens';
    }
    if (target > 4) {
      const value = Number(budget);
      if (!value || value < 500) {
        next.budget = 'Enter a realistic budget (minimum Rs 500)';
      }
      if (!paymentMethod) {
        next.paymentMethod = 'Choose how you will pay for this task';
      } else if (paymentMethod === 'wallet' && !walletCovers(wallet.available, value)) {
        next.paymentMethod =
          'Your wallet balance does not cover this budget — top up or pick another method';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validate(2)) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!validate(4)) return;
      setStep(4);
    } else if (step === 4) {
      if (!validate(5)) return;
      toast({
        title: 'Step 1–4 completed!',
        description: 'Steps 5 & 6 will be implemented in the next phase.',
        variant: 'success',
      });
    }
  };

  const handleSkipPhotos = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 1) {
      setDiscardOpen(true);
    } else {
      setStep(step - 1);
    }
  };

  const renderPaymentIcon = (id: PaymentMethod, active: boolean) => {
    const color = active ? '#0094F7' : '#5B6A72';
    switch (id) {
      case 'cash':
        return <Banknote size={18} color={color} />;
      case 'card':
        return <CreditCard size={18} color={color} />;
      case 'wallet':
        return <Wallet2 size={18} color={color} />;
      default:
        return null;
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View className="z-20 shrink-0 border-b border-ink-100 bg-white px-5 pb-5 pt-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            className="-ml-2 mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-ink-100"
          >
            <ChevronLeft size={24} color="#0C1417" />
          </Pressable>

          <Text className="flex-1 text-[17px] font-geist-semibold tracking-[-0.02em] text-ink">
            Post a task
          </Text>

          <Pressable
            onPress={() => setDiscardOpen(true)}
            hitSlop={10}
            className="ml-2 py-1"
          >
            <Text className="font-geist-medium text-[13.5px] text-ink-500">
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* Step Progress Tracker */}
        <View className="mb-1 mt-3.5">
          <StepProgress current={step} total={6} label={steps[step - 1]} />
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 bg-canvas"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pb-10 pt-6">
            {/* STEP 1: BASICS */}
            {step === 1 && (
              <View>
                {/* 1. Intro Section */}
                <StepIntro
                  title="What do you need done?"
                  body="Write it the way you would say it to a friend."
                />

                {/* 2. Title Section */}
                <View className="mt-7 w-full" style={{ marginTop: 24 }}>
                  <TextField
                    label="Task title"
                    value={title}
                    onChangeText={(val) => {
                      setTitle(val);
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    error={errors.title}
                    placeholder="e.g. Deep clean a 2-bedroom apartment"
                    hint={`${title.length}/80 characters`}
                    maxLength={80}
                  />
                </View>

                {/* 3. Category Section */}
                <View className="mt-7 w-full" style={{ marginTop: 24 }}>
                  <View
                    className="mb-2.5 flex-row items-baseline justify-between"
                    style={{ marginBottom: 10 }}
                  >
                    <Text className="text-[13px] font-geist-medium text-ink-700">
                      Category
                    </Text>
                  </View>

                  <View>
                    {categoryRows.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className="mb-2.5 flex-row gap-2.5"
                        style={{ gap: 10, marginBottom: 10 }}
                      >
                        {row.map((category) => {
                          const active = categoryId === category.id;
                          return (
                            <Pressable
                              key={category.id}
                              onPress={() => {
                                setCategoryId(category.id);
                                if (errors.categoryId) {
                                  setErrors((prev) => ({ ...prev, categoryId: '' }));
                                }
                              }}
                              className={`flex-1 items-center justify-center rounded-2xl border px-1 py-3.5 ${
                                active
                                  ? 'border-brand bg-brand-tint'
                                  : 'border-ink-200 bg-white active:bg-ink-100'
                              }`}
                            >
                              <CategoryIcon
                                categoryId={category.id}
                                size={20}
                                color={active ? '#0072C4' : '#5B6A72'}
                              />
                              <Text
                                numberOfLines={1}
                                className={`mt-1.5 w-full text-center text-[11.5px] ${
                                  active
                                    ? 'font-geist-semibold text-brand-dark'
                                    : 'font-geist-medium text-ink-500'
                                }`}
                              >
                                {category.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </View>

                  {errors.categoryId && (
                    <Text className="mt-2 text-[12px] font-geist-medium text-danger">
                      {errors.categoryId}
                    </Text>
                  )}
                </View>

                {/* 4. Details Section */}
                <View className="mt-7 w-full" style={{ marginTop: 24 }}>
                  <TextArea
                    label="Details"
                    value={description}
                    onChangeText={(val) => {
                      setDescription(val);
                      if (errors.description) {
                        setErrors((prev) => ({ ...prev, description: '' }));
                      }
                    }}
                    error={errors.description}
                    placeholder="Size of the space, what needs doing, anything you will provide, access details…"
                    hint="Tasks with details get 3× more offers."
                  />
                </View>
              </View>
            )}

            {/* STEP 2: PHOTOS */}
            {step === 2 && (
              <View>
                {/* 1. Intro Section */}
                <StepIntro
                  title="Add photos"
                  body="Optional, but photos remove guesswork and get better prices."
                />

                {/* 2. Photo Grid */}
                <View className="mt-7" style={{ marginTop: 24 }}>
                  {photoRows.map((row, rowIndex) => (
                    <View
                      key={rowIndex}
                      className="mb-2.5 flex-row gap-2.5"
                      style={{ gap: 10, marginBottom: 10 }}
                    >
                      {row.map((item) => {
                        if (item.type === 'image') {
                          const { src, index } = item;
                          return (
                            <View
                              key={src}
                              className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-ink-200 bg-white"
                            >
                              <Image
                                source={{ uri: src }}
                                style={styles.cardImage}
                                contentFit="cover"
                              />

                              {/* Delete Photo Button */}
                              <Pressable
                                onPress={() =>
                                  setImages((prev) => prev.filter((x) => x !== src))
                                }
                                hitSlop={8}
                                className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-ink/70 active:bg-ink"
                              >
                                <X size={13} color="#FFFFFF" strokeWidth={2.5} />
                              </Pressable>

                              {/* Cover Label or Make Cover Action */}
                              {index === 0 ? (
                                <View className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 shadow-sm">
                                  <Text className="text-[10px] font-geist-semibold text-ink">
                                    Cover
                                  </Text>
                                </View>
                              ) : (
                                <Pressable
                                  onPress={() => {
                                    setImages((prev) => {
                                      const next = [...prev];
                                      const [shifted] = next.splice(index, 1);
                                      next.unshift(shifted);
                                      return next;
                                    });
                                  }}
                                  className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 shadow-sm"
                                >
                                  <Text className="text-[10px] font-geist-semibold text-ink">
                                    Make cover
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          );
                        }

                        // Add button item
                        return (
                          <Pressable
                            key="add-btn"
                            onPress={() => setPhotoOpen(true)}
                            className="aspect-square flex-1 items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white active:bg-ink-100"
                          >
                            <Plus size={20} color="#5B6A72" />
                            <Text className="mt-1 font-geist-medium text-[11.5px] text-ink-500">
                              Add
                            </Text>
                          </Pressable>
                        );
                      })}

                      {/* Invisible Spacers for incomplete row so cards never stretch */}
                      {Array.from({ length: 3 - row.length }).map((_, spacerIndex) => (
                        <View
                          key={`spacer-${spacerIndex}`}
                          className="flex-1"
                        />
                      ))}
                    </View>
                  ))}
                </View>

                {/* 3. Large Camera Card Button */}
                <Pressable
                  onPress={() => setPhotoOpen(true)}
                  className="mt-6 w-full flex-row items-center rounded-2xl border border-ink-200 bg-white p-4 active:bg-ink-100"
                  style={{ marginTop: 20 }}
                >
                  <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-xl bg-ink-100">
                    <Camera size={18} color="#2B3A41" />
                  </View>
                  <Text className="flex-1 text-[14px] font-geist-medium text-ink">
                    Take a photo or upload from gallery
                  </Text>
                </Pressable>
              </View>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <View>
                {/* 1. Intro Section */}
                <StepIntro
                  title="Where is the task?"
                  body="We show your area publicly, never your exact address."
                />

                {/* 2. Location Picker Card Button */}
                <View className="mt-7" style={{ marginTop: 24 }}>
                  <Pressable
                    onPress={() => setLocationOpen(true)}
                    className={`flex-row items-center rounded-2xl border p-4 bg-white active:bg-ink-100/60 ${
                      errors.location ? 'border-danger' : 'border-ink-200'
                    }`}
                    style={{ gap: 12 }}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
                      <MapPin size={18} color="#0072C4" />
                    </View>

                    <View className="flex-1 min-w-0">
                      <Text className="text-[12px] font-geist text-ink-400">
                        Task location
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 text-[14.5px] font-geist-medium text-ink"
                      >
                        {location || 'Choose a location'}
                      </Text>
                    </View>

                    <Text className="font-geist-medium text-[13px] text-brand">
                      Change
                    </Text>
                  </Pressable>

                  {errors.location && (
                    <Text className="mt-1.5 text-[12px] font-geist-medium text-danger">
                      {errors.location}
                    </Text>
                  )}
                </View>

                {/* 3. Privacy Callout Note */}
                <View className="mt-4 rounded-2xl bg-ink-100/70 p-4">
                  <Text className="text-[12.5px] font-geist leading-relaxed text-ink-700">
                    People within your chosen radius will see this task. You can share the exact address in chat after you accept an offer.
                  </Text>
                </View>
              </View>
            )}

            {/* STEP 4: BUDGET & PAYMENT */}
            {step === 4 && (
              <View>
                {/* 1. Intro Section */}
                <StepIntro
                  title="What is your budget?"
                  body="A realistic budget attracts serious offers."
                />

                {/* 2. Budget Input */}
                <View className="mt-7" style={{ marginTop: 24 }}>
                  <Text className="mb-1.5 text-[13px] font-geist-medium text-ink-700">
                    Budget
                  </Text>
                  <View
                    className={`flex-row items-center rounded-2xl border bg-white px-4 h-[56px] ${
                      errors.budget ? 'border-danger' : 'border-ink-200'
                    }`}
                  >
                    <Text className="mr-2 text-[18px] font-geist-semibold text-ink-400">
                      Rs
                    </Text>
                    <TextInput
                      value={budget}
                      onChangeText={(val) => {
                        setBudget(val.replace(/\D/g, ''));
                        if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
                      }}
                      placeholder="8000"
                      placeholderTextColor="#8A959B"
                      keyboardType="numeric"
                      style={[{ fontFamily: 'Geist-Bold' }]}
                      className="flex-1 text-[22px] font-geist-bold text-ink"
                    />
                  </View>
                  {errors.budget && (
                    <Text className="mt-1.5 text-[12px] font-geist-medium text-danger">
                      {errors.budget}
                    </Text>
                  )}
                </View>

                {/* 3. Preset Quick Chips */}
                <View className="mt-3 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
                  {PRESET_AMOUNTS.map((amount) => (
                    <SelectChip
                      key={amount}
                      selected={budget === String(amount)}
                      onPress={() => {
                        setBudget(String(amount));
                        if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
                      }}
                    >
                      {money(amount)}
                    </SelectChip>
                  ))}
                </View>

                {/* 4. Flexible Budget Toggle Card */}
                <View className="mt-5 rounded-2xl border border-ink-200 bg-white p-4">
                  <Toggle
                    checked={flexible}
                    onChange={setFlexible}
                    label="My budget is flexible"
                    description="People can offer a different price with a reason."
                  />
                </View>

                {/* 5. Payment Methods */}
                <View className="mt-6">
                  <Text className="mb-1 text-[13px] font-geist-medium text-ink-700">
                    How will you pay?
                  </Text>
                  <Text className="mb-2.5 text-[12px] font-geist leading-snug text-ink-500">
                    Taskers see this on your task, so they know whether to bring change.
                  </Text>

                  <View className="gap-2.5" style={{ gap: 10 }}>
                    {PAYMENT_METHODS.map((method) => {
                      const disabled = method.id === 'wallet' && !walletAvailable;
                      const active = paymentMethod === method.id;

                      return (
                        <Pressable
                          key={method.id}
                          disabled={disabled}
                          onPress={() => {
                            setPaymentMethod(method.id);
                            if (errors.paymentMethod) {
                              setErrors((prev) => ({ ...prev, paymentMethod: '' }));
                            }
                          }}
                          className={`flex-row items-center gap-3 rounded-2xl border p-4 active:bg-ink-100/60 ${
                            disabled
                              ? 'border-ink-200 bg-ink-100/60 opacity-60'
                              : active
                              ? 'border-brand bg-brand-tint/50'
                              : 'border-ink-200 bg-white'
                          }`}
                          style={{ gap: 12 }}
                        >
                          <View
                            className="h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: active ? '#FFFFFF' : '#F0F3F4' }}
                          >
                            {renderPaymentIcon(method.id, active)}
                          </View>

                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-1.5">
                              <Text
                                className={`text-[14.5px] font-geist-semibold ${
                                  disabled ? 'text-ink-400' : 'text-ink'
                                }`}
                              >
                                {method.label}
                              </Text>
                              {method.id === 'wallet' && (
                                <Text className="ml-1 text-[11.5px] font-geist-medium text-ink-400">
                                  · {money(wallet.available)} available
                                </Text>
                              )}
                              {disabled && <Lock size={13} color="#8A959B" />}
                            </View>

                            <Text className="mt-0.5 text-[12.5px] font-geist leading-snug text-ink-500">
                              {disabled
                                ? budgetValue > 0
                                  ? `Balance is short of ${money(
                                      budgetValue
                                    )} — top up or choose another method.`
                                  : 'Enter your budget first to use your wallet balance.'
                                : method.description}
                            </Text>
                          </View>

                          {active && <Check size={18} color="#0094F7" strokeWidth={2.5} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  {errors.paymentMethod && (
                    <Text className="mt-1.5 text-[12px] font-geist-medium text-danger">
                      {errors.paymentMethod}
                    </Text>
                  )}
                </View>

                {/* 6. What You Pay Summary Card */}
                {!!budgetValue && (
                  <View className="mt-6 rounded-2xl bg-brand-tint/60 p-4">
                    <Text className="text-[12.5px] font-geist-semibold uppercase tracking-[0.07em] text-brand-dark">
                      What you pay
                    </Text>

                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="font-geist text-[14px] text-ink-700">
                        Agreed price
                      </Text>
                      <Text className="font-geist-semibold text-[14px] text-ink">
                        {money(budgetValue)}
                      </Text>
                    </View>

                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="font-geist text-[14px] text-ink-700">
                        Service fee for you
                      </Text>
                      <Text className="font-geist-semibold text-[14px] text-success">
                        Rs 0
                      </Text>
                    </View>

                    <Text className="mt-2 font-geist text-[11.5px] leading-relaxed text-ink-500">
                      OpenTaskit takes its commission from the provider, so your price is what you pay.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Footer Actions */}
        <View
          className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
        >
          {step === 2 ? (
            <View className="flex-row gap-3" style={{ gap: 12 }}>
              <View className="flex-1">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full"
                  onPress={handleSkipPhotos}
                >
                  Skip photos
                </Button>
              </View>
              <View className="flex-[1.6]">
                <Button
                  size="lg"
                  variant="brand"
                  className="w-full"
                  onPress={goNext}
                >
                  Continue
                </Button>
              </View>
            </View>
          ) : (
            <Button full size="lg" variant="brand" onPress={goNext}>
              Continue
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Photo Picker Modal */}
      <PhotoPicker
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        selected={images}
        onToggle={(src) =>
          setImages((prev) =>
            prev.includes(src) ? prev.filter((x) => x !== src) : [...prev, src]
          )
        }
        onAddImages={(newUris) => {
          setImages((prev) => {
            const next = [...prev];
            for (const uri of newUris) {
              if (!next.includes(uri)) next.push(uri);
            }
            return next;
          });
        }}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(selectedLoc) => {
          setLocation(selectedLoc);
          if (errors.location) {
            setErrors((prev) => ({ ...prev, location: '' }));
          }
        }}
      />

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          toast({ title: 'Draft discarded', variant: 'info' });
          router.back();
        }}
        title="Discard this task?"
        message="Your progress will not be saved. You can start a new task any time."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
      />
    </Screen>
  );
}

function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <Text className="text-[22px] font-geist-semibold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </Text>
      <View className="mt-1.5" style={{ marginTop: 6 }}>
        <Text className="font-geist text-[14px] leading-relaxed text-ink-500">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
