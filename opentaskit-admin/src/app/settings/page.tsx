"use client";

import * as React from "react";
import {
  Settings,
  Percent,
  Wallet,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  // Financial & Commission settings
  const [platformCommissionPercent, setPlatformCommissionPercent] = React.useState<string>("10");
  const [minTaskBudgetLkr, setMinTaskBudgetLkr] = React.useState<string>("1000");
  const [escrowAutoReleaseDays, setEscrowAutoReleaseDays] = React.useState<string>("3");

  // Trust & Verification toggles
  const [requireKycForOffers, setRequireKycForOffers] = React.useState<boolean>(true);
  const [requirePhoneVerification, setRequirePhoneVerification] = React.useState<boolean>(true);

  // Platform contact & terms
  const [supportEmail, setSupportEmail] = React.useState<string>("support@opentaskit.com");
  const [supportHotline, setSupportHotline] = React.useState<string>("+94 11 234 5678");
  const [termsVersion, setTermsVersion] = React.useState<string>("1.2.0");

  const [savedSuccess, setSavedSuccess] = React.useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleResetDefaults = () => {
    setPlatformCommissionPercent("10");
    setMinTaskBudgetLkr("1000");
    setEscrowAutoReleaseDays("3");
    setRequireKycForOffers(true);
    setRequirePhoneVerification(true);
    setSupportEmail("support@opentaskit.com");
    setSupportHotline("+94 11 234 5678");
    setTermsVersion("1.2.0");
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Platform & Marketplace Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure global marketplace commission percentages, escrow auto-release rules, and verification requirements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={handleResetDefaults}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white text-xs gap-1.5 font-semibold shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savedSuccess ? "Saved Successfully" : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Platform configuration updated and saved successfully.</span>
        </div>
      )}

      {/* 1. Financial & Commission Settings Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Marketplace Commission & Escrow Settings
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Define platform service fees deducted upon successful task completion and payout release.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Platform Commission (%)</span>
              <span className="text-[11px] font-mono text-muted-foreground">Standard 10%</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={platformCommissionPercent}
                onChange={(e) => setPlatformCommissionPercent(e.target.value)}
                className="h-9 text-xs pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                %
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deducted automatically from provider task earnings when escrow funds are released.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Minimum Allowed Budget (LKR)
            </label>
            <Input
              type="number"
              step="100"
              min="500"
              value={minTaskBudgetLkr}
              onChange={(e) => setMinTaskBudgetLkr(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum budget posters must specify when creating a new marketplace task.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Escrow Auto-Release (Days)</span>
              <span className="text-[11px] font-mono text-muted-foreground">Default 3 days</span>
            </label>
            <Input
              type="number"
              min="1"
              max="14"
              value={escrowAutoReleaseDays}
              onChange={(e) => setEscrowAutoReleaseDays(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Auto-releases funds to provider if poster does not confirm completion or dispute within this window.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Trust & Verification Policy Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Trust & Identity Verification Policy
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Security requirements enforced across mobile app users and service providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 divide-y text-xs">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">
                Require National ID (NIC) Verification for Making Offers
              </span>
              <span className="text-muted-foreground text-[11px]">
                Service providers must have an approved KYC National ID submission before submitting offers on open tasks.
              </span>
            </div>
            <input
              type="checkbox"
              checked={requireKycForOffers}
              onChange={(e) => setRequireKycForOffers(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary cursor-pointer shrink-0 ml-4"
            />
          </div>

          <div className="flex items-center justify-between py-3 last:pb-0">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">
                Require SMS / Phone Number Verification at Signup
              </span>
              <span className="text-muted-foreground text-[11px]">
                Users must verify their Sri Lankan mobile number with an OTP code during account creation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={requirePhoneVerification}
              onChange={(e) => setRequirePhoneVerification(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary cursor-pointer shrink-0 ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Support & Contact Credentials */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Support Channels & Legal Version
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Public contact info and legal policy versions displayed in the mobile app help center.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Customer Support Email</label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Helpline Hotline Number</label>
            <Input
              value={supportHotline}
              onChange={(e) => setSupportHotline(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Terms & Privacy Version</label>
            <Input
              value={termsVersion}
              onChange={(e) => setTermsVersion(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
