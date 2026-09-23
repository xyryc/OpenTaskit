"use client";

import * as React from "react";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  GitBranch,
  Loader2,
} from "lucide-react";

import { LegalDocRecord, LegalDocSection } from "@/data/mock-data";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LegalPage() {
  const [docs, setDocs] = React.useState<Record<"terms" | "privacy", LegalDocRecord> | null>(null);
  const [activeTab, setActiveTab] = React.useState<"terms" | "privacy">("terms");
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = React.useState<boolean>(false);
  const [lastPublishedVersion, setLastPublishedVersion] = React.useState<string>("");

  const fetchDocs = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminFetch("/api/backend/legal");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load legal documents (HTTP ${res.status})`);
      }
      const data: LegalDocRecord[] = await res.json();
      const bySlug = Object.fromEntries(data.map((d) => [d.slug, d])) as Record<
        "terms" | "privacy",
        LegalDocRecord
      >;
      setDocs(bySlug);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load legal documents");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const currentDoc = docs?.[activeTab] ?? null;

  const handleUpdateHeading = (sectionId: string, heading: string) => {
    setDocs((prev) =>
      prev && {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          sections: prev[activeTab].sections.map((s) =>
            s.id === sectionId ? { ...s, heading } : s
          ),
        },
      }
    );
  };

  const handleUpdateBody = (sectionId: string, body: string) => {
    setDocs((prev) =>
      prev && {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          sections: prev[activeTab].sections.map((s) =>
            s.id === sectionId ? { ...s, body } : s
          ),
        },
      }
    );
  };

  const handleAddSection = () => {
    if (!currentDoc) return;
    const newSection: LegalDocSection = {
      id: `sec-${Date.now()}`,
      heading: `${currentDoc.sections.length + 1}. New Policy Clause`,
      body: "Describe the policy clause or legal requirement here...",
    };
    setDocs((prev) =>
      prev && {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          sections: [...prev[activeTab].sections, newSection],
        },
      }
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    setDocs((prev) =>
      prev && {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          sections: prev[activeTab].sections.filter((s) => s.id !== sectionId),
        },
      }
    );
  };

  const handlePublish = async () => {
    if (!currentDoc) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await adminFetch(`/api/backend/legal/${activeTab}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentDoc.title,
          sections: currentDoc.sections,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to publish (HTTP ${res.status})`);
      }
      const updated: LegalDocRecord = await res.json();
      setDocs((prev) => prev && { ...prev, [activeTab]: updated });
      setLastPublishedVersion(updated.version);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish changes");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading legal documents…</p>
      </div>
    );
  }

  if (loadError || !docs) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 max-w-md mx-auto text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-semibold text-foreground">Couldn&apos;t load legal documents</p>
        <p className="text-xs text-muted-foreground">{loadError}</p>
        <Button type="button" size="sm" variant="outline" onClick={fetchDocs}>
          Retry
        </Button>
      </div>
    );
  }

  if (!currentDoc) return null;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#0094F7]" />
            <span>Legal & Policy Content CMS</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Terms of Service and Privacy Policy clauses rendered directly in the mobile app with automated versioning.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-primary/5 border-primary/20 text-primary gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Terms v{docs.terms.version} · Privacy v{docs.privacy.version}</span>
          </Badge>
          <Button
            type="button"
            size="sm"
            disabled={publishing}
            className="h-9 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white text-xs gap-1.5 font-semibold shadow-sm"
            onClick={handlePublish}
          >
            {publishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{publishing ? "Publishing…" : "Publish & Bump Version"}</span>
          </Button>
        </div>
      </div>

      {/* Save Success Alert */}
      {savedSuccess && currentDoc && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Successfully published <strong>{currentDoc.title}</strong> as version <strong>v{lastPublishedVersion}</strong>! The app will pick this up the next time it loads the document.
          </span>
        </div>
      )}

      {/* Publish Error Alert */}
      {publishError && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2.5 text-destructive text-xs font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Main Tabbed Editor with Dual-Column Live Preview */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "terms" | "privacy")} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="terms" className="text-xs font-semibold px-4 gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span>Terms of Service</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                v{docs.terms.version}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs font-semibold px-4 gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                v{docs.privacy.version}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Auto-Managed Version:</span>
            <Badge variant="outline" className="font-mono text-[11px] text-[#0094F7] border-[#0094F7]/30">
              v{currentDoc.version}
            </Badge>
            <span>•</span>
            <span>Last Published: {new Date(currentDoc.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Clause Section Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {currentDoc.title} Clauses ({currentDoc.sections.length} Sections)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Edit section headings and paragraph bodies.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleAddSection}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Clause</span>
              </Button>
            </div>

            <div className="space-y-4">
              {currentDoc.sections.map((section, index) => (
                <Card key={section.id} className="border-border/60 shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Clause {index + 1}
                    </span>
                    {currentDoc.sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Heading
                      </label>
                      <Input
                        value={section.heading}
                        onChange={(e) => handleUpdateHeading(section.id, e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Body Content
                      </label>
                      <Textarea
                        value={section.body}
                        onChange={(e) => handleUpdateBody(section.id, e.target.value)}
                        className="text-xs leading-relaxed min-h-[75px] resize-y"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Mobile App Live Preview Mockup */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Eye className="h-4 w-4 text-[#0094F7]" />
                  <span>Real-Time Mobile App Preview</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  doc/{currentDoc.slug}
                </Badge>
              </div>

              {/* Mobile Phone Mockup Frame */}
              <div className="mx-auto max-w-[340px] rounded-[36px] border-4 border-muted-foreground/20 bg-background shadow-2xl p-3">
                <div className="h-4 w-28 bg-muted/60 rounded-full mx-auto mb-3" />

                {/* Mobile Screen Container */}
                <div className="h-[520px] rounded-[24px] bg-muted/10 border p-4 overflow-y-auto flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b pb-3">
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        OpenTaskit Legal
                      </span>
                      <h4 className="text-base font-bold text-foreground mt-0.5">
                        {currentDoc.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                          v{currentDoc.version}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Published {new Date(currentDoc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Clauses Feed */}
                    <div className="space-y-3.5">
                      {currentDoc.sections.map((s) => (
                        <div key={s.id} className="space-y-1 bg-background/80 p-3 rounded-xl border border-border/40">
                          <h5 className="text-[11px] font-bold text-foreground">
                            {s.heading}
                          </h5>
                          <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                            {s.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      Auto-synced with OpenTaskit Mobile App Client
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
