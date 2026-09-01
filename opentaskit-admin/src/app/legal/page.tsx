"use client";

import * as React from "react";
import {
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Smartphone,
  RotateCcw,
  Eye,
  Layers,
} from "lucide-react";

import { MOCK_LEGAL_DOCS, LegalDocRecord, LegalDocSection } from "@/data/mock-data";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LegalPage() {
  const [docs, setDocs] = React.useState<Record<"terms" | "privacy", LegalDocRecord>>(MOCK_LEGAL_DOCS);
  const [activeTab, setActiveTab] = React.useState<"terms" | "privacy">("terms");
  const [savedSuccess, setSavedSuccess] = React.useState<boolean>(false);

  const currentDoc = docs[activeTab];

  const handleUpdateHeading = (sectionId: string, heading: string) => {
    setDocs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: prev[activeTab].sections.map((s) =>
          s.id === sectionId ? { ...s, heading } : s
        ),
      },
    }));
  };

  const handleUpdateBody = (sectionId: string, body: string) => {
    setDocs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: prev[activeTab].sections.map((s) =>
          s.id === sectionId ? { ...s, body } : s
        ),
      },
    }));
  };

  const handleAddSection = () => {
    const newSection: LegalDocSection = {
      id: `sec-${Date.now()}`,
      heading: `${currentDoc.sections.length + 1}. New Policy Clause`,
      body: "Describe the policy clause or legal requirement here...",
    };
    setDocs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: [...prev[activeTab].sections, newSection],
      },
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    setDocs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sections: prev[activeTab].sections.filter((s) => s.id !== sectionId),
      },
    }));
  };

  const handleSave = () => {
    setDocs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        updatedAt: new Date().toISOString(),
      },
    }));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Legal & Policy Content CMS
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Terms of Service and Privacy Policy clauses rendered directly in the mobile app.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            size="sm"
            className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white text-xs gap-1.5 font-semibold shadow-sm"
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savedSuccess ? "Published Successfully" : "Publish to Mobile App"}</span>
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{currentDoc.title} updated and published live to the mobile app.</span>
        </div>
      )}

      {/* Tabs Selector */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "terms" | "privacy")} className="w-full space-y-6">
        <TabsList className="h-10 bg-muted/60 p-1">
          <TabsTrigger value="terms" className="text-xs gap-1.5 px-4 font-semibold">
            <FileText className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs gap-1.5 px-4 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </TabsTrigger>
        </TabsList>

        {/* Dual Layout: Editor Left, Live Mobile Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7/12): Policy Clauses Editor */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {currentDoc.title} Editor
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Last Updated: {new Date(currentDoc.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleAddSection}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Clause Section</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {currentDoc.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl border bg-muted/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <Input
                          value={sec.heading}
                          onChange={(e) => handleUpdateHeading(sec.id, e.target.value)}
                          className="h-8 text-xs font-semibold bg-background"
                          placeholder="Section Title"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteSection(sec.id)}
                        disabled={currentDoc.sections.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      value={sec.body}
                      onChange={(e) => handleUpdateBody(sec.id, e.target.value)}
                      className="text-xs min-h-[75px] bg-background leading-relaxed"
                      placeholder="Section body text and clauses..."
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (5/12): Live Mobile App Mockup Preview */}
          <div className="lg:col-span-5 sticky top-20">
            <Card className="border-border/60 shadow-xs overflow-hidden">
              <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Mobile App Live Preview
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  legal/[doc].tsx
                </Badge>
              </CardHeader>

              {/* Mobile Device Frame */}
              <div className="p-4 bg-muted/30 flex justify-center">
                <div className="w-full max-w-[340px] rounded-2xl border-2 border-border/80 bg-background shadow-lg overflow-hidden flex flex-col min-h-[480px] max-h-[540px]">
                  {/* Mock Mobile App Top Header */}
                  <div className="px-4 py-3 border-b bg-background flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {currentDoc.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      OpenTaskit
                    </span>
                  </div>

                  {/* Mock Mobile Scroll Content */}
                  <div className="p-4 overflow-y-auto space-y-4 flex-1 text-[11px] leading-relaxed">
                    <div className="pb-2 border-b">
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Updated {new Date(currentDoc.updatedAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {currentDoc.sections.map((sec) => (
                      <div key={sec.id} className="space-y-1">
                        <h4 className="font-bold text-foreground text-xs">
                          {sec.heading}
                        </h4>
                        <p className="text-muted-foreground leading-normal">
                          {sec.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
