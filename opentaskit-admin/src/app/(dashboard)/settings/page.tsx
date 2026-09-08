"use client";

import * as React from "react";
import {
  Settings,
  Percent,
  Wallet,
  Phone,
  Mail,
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

export default function SettingsPage() {
  // Financial & Commission settings
  const [platformCommissionPercent, setPlatformCommissionPercent] = React.useState<string>("10");
  const [minTaskBudgetLkr, setMinTaskBudgetLkr] = React.useState<string>("1000");
  const [escrowAutoReleaseDays, setEscrowAutoReleaseDays] = React.useState<string>("3");

  // Platform contact channels
  const [supportEmail, setSupportEmail] = React.useState<string>("support@opentaskit.com");
  const [supportHotline, setSupportHotline] = React.useState<string>("+94 11 234 5678");

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
    setSupportEmail("support@opentaskit.com");
    setSupportHotline("+94 11 234 5678");
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#0094F7]" />
            <span>Platform Global Settings</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure platform commission take-rates, minimum budgets, escrow timers, and support contact channels.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            className="h-9 gap-1.5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white font-semibold"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Save Success Banner */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Platform configuration settings successfully updated!</span>
        </div>
      )}

      {/* 1. Financial & Commission Rules Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-[#0094F7]" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Platform Fees & Commission Rules
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
              Live & Active
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Define default platform commissions deducted upon task completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Platform Commission */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Platform Take-Rate (%)</span>
              <span className="text-muted-foreground font-normal">Default: 10%</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={platformCommissionPercent}
                onChange={(e) => setPlatformCommissionPercent(e.target.value)}
                className="h-9 text-xs pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                %
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deducted automatically from the task budget upon completion release.
            </p>
          </div>

          {/* Minimum Task Budget */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Minimum Task Budget (LKR)</span>
              <span className="text-muted-foreground font-normal">Default: 1,000</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="100"
                step="100"
                value={minTaskBudgetLkr}
                onChange={(e) => setMinTaskBudgetLkr(e.target.value)}
                className="h-9 text-xs pr-12"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                LKR
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Minimum allowed amount when users create a new task.
            </p>
          </div>

          {/* Escrow Auto-Release Window */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Escrow Auto-Release (Days)</span>
              <span className="text-muted-foreground font-normal">Default: 3 days</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="30"
                value={escrowAutoReleaseDays}
                onChange={(e) => setEscrowAutoReleaseDays(e.target.value)}
                className="h-9 text-xs pr-12"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                Days
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Auto-releases funds to provider if poster does not confirm completion or dispute within this window.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Support & Contact Credentials */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Support Channels & Contact Info
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Public contact info displayed in the mobile app help center.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Customer Support Email</label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Email recipient for automated user notifications and escalations.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Helpline Phone Number</label>
            <Input
              type="text"
              value={supportHotline}
              onChange={(e) => setSupportHotline(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Hotline displayed on the mobile help center contact card.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
