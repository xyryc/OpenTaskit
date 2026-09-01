import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  Lock,
  ScanFace,
  ShieldCheck,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

const DOCUMENTS = [
  {
    id: 'nic',
    label: 'National ID (NIC)',
    note: 'Fastest to verify',
    icon: <CreditCard size={20} color="#0094F7" />,
  },
  {
    id: 'passport',
    label: 'Passport',
    note: 'Photo page only',
    icon: <FileText size={20} color="#0094F7" />,
  },
  {
    id: 'licence',
    label: 'Driver’s licence',
    note: 'Front and back',
    icon: <CreditCard size={20} color="#0094F7" />,
  },
];

const STEP_LABELS = [
  'Personal info',
  'Document type',
  'Document photos',
  'Selfie',
  'Review',
];

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kyc, setKyc, me, toast } = useApp();

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState(me.name);
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState('12 Apr 1995');
  const [docType, setDocType] = useState('nic');

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Status Screen: Verified
  if (!started && kyc === 'verified') {
    return (
      <StatusScreen
        tone="success"
        icon={<BadgeCheck size={48} color="#0E9F6E" />}
        title="You are verified"
        body="Your identity has been confirmed. The verified badge shows on your profile, offers and tasks."
        primaryLabel="Back to profile"
        onPrimary={() => router.back()}
      />
    );
  }

  // Status Screen: Pending
  if (!started && kyc === 'pending') {
    return (
      <StatusScreen
        tone="warning"
        icon={<Clock size={48} color="#C27803" />}
        title="Verification in review"
        body="We are checking your documents. This usually takes under 24 hours and you can keep using OpenTaskit meanwhile."
        primaryLabel="Back to profile"
        onPrimary={() => router.back()}
        secondaryLabel="Preview verified state"
        onSecondary={() => {
          setKyc('verified');
          toast({ title: 'Identity verified', variant: 'success' });
        }}
      />
    );
  }

  // Status Screen: Rejected
  if (!started && kyc === 'rejected') {
    return (
      <StatusScreen
        tone="danger"
        icon={<AlertTriangle size={48} color="#C7382F" />}
        title="Verification rejected"
        body="The photo of your document was too blurry to read. Retake it in good light with all four corners visible."
        primaryLabel="Resubmit documents"
        onPrimary={() => {
          setStarted(true);
          setStep(1);
        }}
        secondaryLabel="Back to profile"
        onSecondary={() => router.back()}
      />
    );
  }

  // Intro Screen
  if (!started) {
    return (
      <Screen tone="white" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Identity verification" border={false} />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-6 pt-2">
            <View className="h-14 w-14 items-center justify-center rounded-3xl bg-brand-tint">
              <ShieldCheck size={28} color="#0094F7" />
            </View>

            <Text className="mt-4 text-[24px] font-geist-bold leading-tight tracking-[-0.03em] text-ink">
              Verify once, earn trust everywhere
            </Text>

            <Text className="mt-2 font-geist text-[14.5px] leading-relaxed text-ink-500">
              Verified members get their offers accepted twice as often. It takes about 3 minutes.
            </Text>

            <View className="mt-6 gap-3" style={{ gap: 12 }}>
              {[
                {
                  title: 'Your details stay private',
                  body: 'Documents are encrypted and never shown to other members.',
                },
                {
                  title: 'Only your badge is public',
                  body: 'Others see “Verified”, never your ID number.',
                },
                {
                  title: 'Required for higher-value jobs',
                  body: 'Unlocks tasks above Rs 20,000 and faster payouts.',
                },
              ].map((item) => (
                <View
                  key={item.title}
                  className="flex-row items-start gap-3 rounded-3xl border border-ink-200 bg-white p-4"
                  style={{ gap: 12 }}
                >
                  <View className="mt-0.5 h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand">
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[14px] font-geist-semibold text-ink">
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-[12.5px] font-geist leading-snug text-ink-500">
                      {item.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-6 flex-row items-center gap-2" style={{ gap: 8 }}>
              <Lock size={14} color="#8A959B" />
              <Text className="flex-1 font-geist text-[12px] text-ink-400">
                Encrypted end to end · reviewed by OpenTaskit trust & safety
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
        >
          <Button full size="lg" variant="brand" onPress={() => setStarted(true)}>
            Start verification
          </Button>
        </View>
      </Screen>
    );
  }

  // Camera Picker Handler
  const capturePhoto = async (type: 'front' | 'back' | 'selfie') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo access is required for document verification.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        if (type === 'front') {
          setFrontUri(res.assets[0].uri);
          setErrors((prev) => ({ ...prev, front: '' }));
        } else if (type === 'back') {
          setBackUri(res.assets[0].uri);
          setErrors((prev) => ({ ...prev, back: '' }));
        } else {
          setSelfieUri(res.assets[0].uri);
          setErrors((prev) => ({ ...prev, selfie: '' }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validate = () => {
    const nextErr: Record<string, string> = {};
    if (step === 1) {
      if (fullName.trim().length < 3)
        nextErr.fullName = 'Enter the name exactly as printed on your document';
      if (idNumber.trim().length < 6)
        nextErr.idNumber = 'Enter your document number';
    }
    if (step === 3) {
      if (!frontUri) nextErr.front = 'Capture the front of your document';
      if (docType !== 'passport' && !backUri)
        nextErr.back = 'Capture the back of your document';
    }
    if (step === 4 && !selfieUri) {
      nextErr.selfie = 'Take a selfie to match your document';
    }
    setErrors(nextErr);
    return Object.keys(nextErr).length === 0;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setKyc('pending');
      setStarted(false);
      toast({
        title: 'Documents submitted',
        description: 'We will review within 24 hours.',
        variant: 'success',
      });
    }, 1200);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Verification Header with Step Progress */}
      <View className="border-b border-ink-100 bg-white px-5 pb-3 pt-3">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => (step === 1 ? setStarted(false) : setStep(step - 1))}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center rounded-full active:bg-ink-100"
          >
            <ChevronLeft size={24} color="#0C1417" />
          </Pressable>
          <Text className="flex-1 text-[17px] font-geist-semibold text-ink">
            Verification
          </Text>
        </View>

        {/* Step Progress Bar */}
        <View className="mt-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="font-geist-medium text-[12px] text-ink-500">
              Step {step} of 5 · {STEP_LABELS[step - 1]}
            </Text>
          </View>
          <View className="mt-1.5 flex-row gap-1" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  s <= step ? 'bg-brand' : 'bg-ink-200'
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-10 pt-5" style={{ gap: 20 }}>
          {/* STEP 1: Personal info */}
          {step === 1 && (
            <View className="gap-4" style={{ gap: 16 }}>
              <TextField
                label="Full legal name"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                error={errors.fullName}
              />
              <TextField
                label="Document number"
                value={idNumber}
                onChangeText={(val) => {
                  setIdNumber(val);
                  if (errors.idNumber) setErrors((prev) => ({ ...prev, idNumber: '' }));
                }}
                placeholder="199512345678"
                error={errors.idNumber}
              />
              <TextField
                label="Date of birth"
                value={dob}
                onChangeText={setDob}
              />
              <View className="rounded-2xl bg-ink-100/70 p-3.5">
                <Text className="font-geist text-[12px] leading-relaxed text-ink-700">
                  Make sure these details match your document exactly — mismatches are the most common reason for rejection.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: Document type */}
          {step === 2 && (
            <View className="gap-2.5" style={{ gap: 10 }}>
              {DOCUMENTS.map((doc) => {
                const selected = docType === doc.id;
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => setDocType(doc.id)}
                    className={`flex-row items-center gap-3 rounded-3xl border p-4 active:bg-ink-100/60 ${
                      selected
                        ? 'border-brand bg-brand-tint/50'
                        : 'border-ink-200 bg-white'
                    }`}
                    style={{ gap: 12 }}
                  >
                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {doc.icon}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-[14.5px] font-geist-semibold text-ink">
                        {doc.label}
                      </Text>
                      <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                        {doc.note}
                      </Text>
                    </View>
                    {selected && <Check size={18} color="#0094F7" />}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* STEP 3: Document photos */}
          {step === 3 && (
            <View className="gap-3.5" style={{ gap: 14 }}>
              <CaptureCard
                label="Front of document"
                imageUri={frontUri}
                onCapture={() => capturePhoto('front')}
                error={errors.front}
              />

              {docType !== 'passport' && (
                <CaptureCard
                  label="Back of document"
                  imageUri={backUri}
                  onCapture={() => capturePhoto('back')}
                  error={errors.back}
                />
              )}

              <View className="rounded-2xl bg-ink-100/70 p-4">
                <Text className="font-geist text-[12.5px] leading-relaxed text-ink-700">
                  · All four corners inside the frame{'\n'}
                  · No glare or shadows across the text{'\n'}
                  · Original document, not a photocopy
                </Text>
              </View>
            </View>
          )}

          {/* STEP 4: Selfie */}
          {step === 4 && (
            <View className="gap-3" style={{ gap: 12 }}>
              <View
                className={`items-center rounded-3xl border-2 border-dashed p-8 text-center ${
                  selfieUri
                    ? 'border-brand bg-brand-tint/40'
                    : errors.selfie
                    ? 'border-danger bg-white'
                    : 'border-ink-300 bg-white'
                }`}
              >
                {selfieUri ? (
                  <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-brand">
                    <Image
                      source={{ uri: selfieUri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-ink-100">
                    <ScanFace size={40} color="#5B6A72" />
                  </View>
                )}

                <Text className="mt-4 text-[16px] font-geist-semibold text-ink">
                  {selfieUri ? 'Selfie captured' : 'Take a quick selfie'}
                </Text>
                <Text className="mt-1 text-center font-geist text-[12.5px] leading-relaxed text-ink-500">
                  We match your face to your document photo. Nothing is shared publicly.
                </Text>

                <View className="mt-4 w-full max-w-[200px]">
                  <Button
                    size="md"
                    variant="outline"
                    icon={<Camera size={16} color="#0C1417" />}
                    onPress={() => capturePhoto('selfie')}
                  >
                    {selfieUri ? 'Retake selfie' : 'Take photo'}
                  </Button>
                </View>
              </View>

              {errors.selfie && (
                <Text className="text-[12px] font-geist-medium text-danger">
                  {errors.selfie}
                </Text>
              )}
            </View>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <View className="gap-4" style={{ gap: 16 }}>
              <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white px-4">
                <ReviewRow label="Full name" value={fullName} />
                <ReviewRow
                  label="Document"
                  value={DOCUMENTS.find((d) => d.id === docType)?.label ?? ''}
                />
                <ReviewRow label="Document number" value={idNumber} />
                <ReviewRow label="Date of birth" value={dob} />
                <ReviewRow
                  label="Photos"
                  value={`${frontUri ? 1 : 0}${
                    docType !== 'passport' && backUri ? ' + 1' : ''
                  } + selfie`}
                />
              </View>

              <View className="flex-row items-start gap-2 rounded-2xl bg-ink-100/70 p-3.5" style={{ gap: 8 }}>
                <Lock size={14} color="#8A959B" />
                <Text className="flex-1 font-geist text-[12px] leading-relaxed text-ink-700">
                  By submitting you confirm the details are yours and agree to identity checks under our Privacy Policy.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer Action */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        {step < 5 ? (
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() => {
              if (validate()) setStep(step + 1);
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            full
            size="lg"
            variant="brand"
            loading={submitting}
            onPress={handleSubmit}
          >
            Submit for verification
          </Button>
        )}
      </View>
    </Screen>
  );
}

function CaptureCard({
  label,
  imageUri,
  onCapture,
  error,
}: {
  label: string;
  imageUri: string | null;
  onCapture: () => void;
  error?: string;
}) {
  return (
    <View>
      <Pressable
        onPress={onCapture}
        className={`flex-row items-center gap-3 rounded-3xl border-2 border-dashed p-4 active:bg-ink-100/60 ${
          imageUri
            ? 'border-brand bg-brand-tint/40'
            : error
            ? 'border-danger bg-white'
            : 'border-ink-300 bg-white'
        }`}
        style={{ gap: 12 }}
      >
        {imageUri ? (
          <View className="h-12 w-12 overflow-hidden rounded-2xl border border-brand">
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-ink-100">
            <Camera size={20} color="#5B6A72" />
          </View>
        )}

        <View className="flex-1 min-w-0">
          <Text className="text-[14.5px] font-geist-semibold text-ink">
            {label}
          </Text>
          <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
            {imageUri ? 'Photo captured · tap to retake' : 'Tap to select / take photo'}
          </Text>
        </View>
        {imageUri && <Check size={18} color="#0094F7" />}
      </Pressable>
      {error && (
        <Text className="mt-1.5 px-1 text-[12px] font-geist-medium text-danger">
          {error}
        </Text>
      )}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3.5">
      <Text className="font-geist text-[13px] text-ink-500">{label}</Text>
      <Text className="font-geist-semibold text-[13.5px] text-ink">{value}</Text>
    </View>
  );
}

function StatusScreen({
  tone,
  icon,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  tone: 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const toneBg =
    tone === 'success'
      ? 'bg-success/15'
      : tone === 'warning'
      ? 'bg-warning/15'
      : 'bg-danger/15';

  return (
    <Screen tone="white" edges={['top']}>
      <ScreenHeader title="Identity verification" border={false} />
      <View className="flex-1 items-center justify-center px-8 text-center">
        <View className={`h-24 w-24 items-center justify-center rounded-3xl ${toneBg}`}>
          {icon}
        </View>
        <Text className="mt-6 text-[24px] font-geist-bold tracking-[-0.03em] text-ink text-center">
          {title}
        </Text>
        <Text className="mt-2 font-geist text-[14.5px] leading-relaxed text-ink-500 text-center">
          {body}
        </Text>
      </View>

      <View
        className="shrink-0 gap-2.5 px-6 pb-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4, gap: 10 }}
      >
        <Button full size="lg" variant="brand" onPress={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button full size="lg" variant="ghost" onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </View>
    </Screen>
  );
}
