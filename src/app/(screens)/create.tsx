import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Camera, ChevronLeft, Plus, X } from "lucide-react-native";

import { useApp } from "@/contexts/AppContext";
import { categories } from "@/data/categories";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { TextField, TextArea } from "@/components/ui/Input";
import { StepProgress } from "@/components/ui/Segmented";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PhotoPicker } from "@/components/create/PhotoPicker";

const steps = [
  "Basics",
  "Photos",
  "Location",
  "Budget & payment",
  "Schedule",
  "Review",
];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAccount, toast } = useApp();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoOpen, setPhotoOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Require account for posting
  useEffect(() => {
    if (!requireAccount("post")) {
      router.replace("/home");
    }
  }, [requireAccount, router]);

  // Categories in rows of 3
  const categoryRows = useMemo(() => chunkArray(categories, 3), []);

  // Photo grid items in rows of 3
  const photoRows = useMemo(() => {
    const items = [
      ...images.map((src, index) => ({ type: "image" as const, src, index })),
      { type: "add" as const },
    ];
    return chunkArray(items, 3);
  }, [images]);

  const validate = (target: number) => {
    const next: Record<string, string> = {};
    if (target > 1) {
      if (title.trim().length < 8) {
        next.title = "Give your task a clear title (at least 8 characters)";
      }
      if (!categoryId) {
        next.categoryId = "Pick the closest category";
      }
      if (description.trim().length < 20) {
        next.description =
          "Add a few details so offers are accurate (minimum 20 characters)";
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
      toast({
        title: "Step 1 & 2 completed!",
        description: "Steps 3–6 will be implemented in the next phase.",
        variant: "success",
      });
    }
  };

  const handleSkipPhotos = () => {
    toast({
      title: "Photos skipped",
      description: "Steps 3–6 will be implemented in the next phase.",
      variant: "info",
    });
  };

  const handleBack = () => {
    if (step === 1) {
      setDiscardOpen(true);
    } else {
      setStep(step - 1);
    }
  };

  return (
    <Screen tone="canvas" edges={["top"]}>
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

          <Text className="flex-1 text-[17px] font-geist font-semibold tracking-[-0.02em] text-ink">
            Post a task
          </Text>

          <Pressable
            onPress={() => setDiscardOpen(true)}
            hitSlop={10}
            className="ml-2 py-1"
          >
            <Text className="font-geist font-medium text-[13.5px] text-ink-500">
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                      if (errors.title)
                        setErrors((prev) => ({ ...prev, title: "" }));
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
                    <Text className="text-[13px] font-geist font-medium text-ink-700">
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
                                  setErrors((prev) => ({
                                    ...prev,
                                    categoryId: "",
                                  }));
                                }
                              }}
                              className={`flex-1 items-center justify-center rounded-2xl border px-1 py-3.5 ${
                                active
                                  ? "border-brand bg-brand-tint"
                                  : "border-ink-200 bg-white active:bg-ink-100"
                              }`}
                            >
                              <CategoryIcon
                                categoryId={category.id}
                                size={20}
                                color={active ? "#0072C4" : "#5B6A72"}
                              />
                              <Text
                                numberOfLines={1}
                                className={`mt-1.5 w-full text-center text-[11.5px] ${
                                  active
                                    ? "font-geist font-semibold text-brand-dark"
                                    : "font-geist font-medium text-ink-500"
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
                    <Text className="mt-2 text-[12px] font-geist font-medium text-danger">
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
                        setErrors((prev) => ({ ...prev, description: "" }));
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
                        if (item.type === "image") {
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
                                  setImages((prev) =>
                                    prev.filter((x) => x !== src),
                                  )
                                }
                                hitSlop={8}
                                className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-ink/70 active:bg-ink"
                              >
                                <X
                                  size={13}
                                  color="#FFFFFF"
                                  strokeWidth={2.5}
                                />
                              </Pressable>

                              {/* Cover Label or Make Cover Action */}
                              {index === 0 ? (
                                <View className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 shadow-sm">
                                  <Text className="text-[10px] font-geist font-semibold text-ink">
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
                                  <Text className="text-[10px] font-geist font-semibold text-ink">
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
                            <Text className="mt-1 font-geist font-medium text-[11.5px] text-ink-500">
                              Add
                            </Text>
                          </Pressable>
                        );
                      })}

                      {/* Invisible Spacers for incomplete row so cards never stretch */}
                      {Array.from({ length: 3 - row.length }).map(
                        (_, spacerIndex) => (
                          <View
                            key={`spacer-${spacerIndex}`}
                            className="flex-1"
                          />
                        ),
                      )}
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
                  <Text className="flex-1 text-[14px] font-geist font-medium text-ink">
                    Take a photo or upload from gallery
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Footer Actions */}
        <View
          className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
        >
          {step === 1 ? (
            <Button full size="lg" variant="brand" onPress={goNext}>
              Continue
            </Button>
          ) : (
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
            prev.includes(src) ? prev.filter((x) => x !== src) : [...prev, src],
          )
        }
      />

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          toast({ title: "Draft discarded", variant: "info" });
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
      <Text className="text-[22px] font-geist-bold font-semibold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </Text>
      <View className="mt-1.5" style={{ marginTop: 6 }}>
        <Text className="font-geist font-normal text-[14px] leading-relaxed text-ink-500">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
