"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  User,
  ShieldCheck,
  Phone,
  Mail,
  Wallet,
  Clock,
  ExternalLink,
  Headphones,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { MOCK_SUPPORT_CHATS, SupportChatThreadRecord, SupportChatMessage } from "@/data/mock-data";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const QUICK_CANNED_REPLIES = [
  "Hello! How can our support team assist you today?",
  "Our verification team is reviewing your National ID queue submission.",
  "Your escrow payment will be released upon task completion confirmation.",
  "Please open the task and tap 'Raise Dispute' so our team can hold escrow.",
];

export default function SupportChatPage() {
  const [threads, setThreads] = React.useState<SupportChatThreadRecord[]>(MOCK_SUPPORT_CHATS);
  const [activeThreadId, setActiveThreadId] = React.useState<string>(MOCK_SUPPORT_CHATS[0]?.id || "");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "RESOLVED">("ACTIVE");
  const [replyDraft, setReplyDraft] = React.useState<string>("");

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || replyDraft).trim();
    if (!text || !activeThread) return;

    const newMsg: SupportChatMessage = {
      id: `m-${Date.now()}`,
      sender: "ADMIN",
      senderName: "Support Admin",
      text,
      createdAt: new Date().toISOString(),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              lastMessage: text,
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    setReplyDraft("");
  };

  const handleToggleResolved = (threadId: string, currentStatus: "ACTIVE" | "RESOLVED") => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              status: currentStatus === "ACTIVE" ? "RESOLVED" : "ACTIVE",
            }
          : t
      )
    );
  };

  const activeCount = threads.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Headphones className="h-6 w-6 text-[#0094F7]" />
            <span>Live Support Desk & In-App Chat</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time chat inbox for answering user inquiries sent from the mobile Help Centre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-primary/5 border-primary/20 text-primary gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount} Active Chat Threads</span>
          </Badge>
        </div>
      </div>

      {/* Main Dual-Pane Chat Card */}
      <Card className="border-border/60 shadow-xs flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Pane (1/3): Thread List */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col shrink-0 bg-muted/10 min-h-0">
          {/* Thread Filter & Search */}
          <div className="p-3 border-b space-y-2 bg-background/50">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs w-full bg-background"
              />
            </div>
            <div className="flex gap-1.5">
              {(["ACTIVE", "RESOLVED", "ALL"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant={statusFilter === tab ? "default" : "outline"}
                  size="sm"
                  className={`h-7 px-2.5 text-[11px] flex-1 ${
                    statusFilter === tab ? "bg-[#0094F7] text-white" : ""
                  }`}
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab === "ACTIVE" ? "Active" : tab === "RESOLVED" ? "Resolved" : "All"}
                </Button>
              ))}
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No chat conversations found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#0094F7]/10 border-l-3 border-[#0094F7]"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {thread.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {thread.userName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                          {thread.userRole}
                        </Badge>
                        {thread.status === "RESOLVED" && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-600 border-emerald-500/30">
                            Resolved
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {thread.lastMessage}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-[#0094F7] shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane (2/3): Chat Workspace */}
        {activeThread ? (
          <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Chat Top Header & User Card */}
            <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {activeThread.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {activeThread.userName}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {activeThread.userRole}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{activeThread.userPhone}</span>
                    <span>•</span>
                    <span>Wallet: LKR {activeThread.walletBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  asChild
                >
                  <Link href={`/users/${activeThread.userId}`}>
                    <User className="h-3.5 w-3.5" />
                    <span>View Profile</span>
                  </Link>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={activeThread.status === "ACTIVE" ? "outline" : "default"}
                  className={`h-8 text-xs gap-1.5 ${
                    activeThread.status === "ACTIVE"
                      ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      : "bg-emerald-600 text-white"
                  }`}
                  onClick={() => handleToggleResolved(activeThread.id, activeThread.status)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{activeThread.status === "ACTIVE" ? "Mark Resolved" : "Re-open Thread"}</span>
                </Button>
              </div>
            </div>

            {/* Scrollable Messages Transcript */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0 bg-muted/5">
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border">
                  Thread started with {activeThread.userName} ({activeThread.userEmail})
                </span>
              </div>

              {activeThread.messages.map((msg) => {
                const isAdmin = msg.sender === "ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                      {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isAdmin
                          ? "bg-[#0094F7] text-white rounded-br-xs shadow-xs"
                          : "border bg-background text-foreground rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Canned Responses Bar */}
            <div className="px-4 py-2 border-t bg-muted/15 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
                Quick:
              </span>
              {QUICK_CANNED_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(reply)}
                  className="px-2.5 py-1 rounded-full border bg-background text-[11px] text-muted-foreground hover:text-foreground hover:border-[#0094F7]/40 shrink-0 transition-colors"
                >
                  {reply.length > 35 ? `${reply.slice(0, 35)}...` : reply}
                </button>
              ))}
            </div>

            {/* Bottom Reply Input Bar */}
            <div className="p-3 sm:p-4 border-t bg-background shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder={`Reply to ${activeThread.userName}...`}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  className="h-10 text-xs flex-1"
                />
                <Button
                  type="submit"
                  size="default"
                  className="h-10 px-5 bg-[#0094F7] hover:bg-[#007cd6] text-white text-xs font-semibold gap-1.5 shadow-sm shrink-0"
                  disabled={!replyDraft.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-muted-foreground">
            Select a conversation thread on the left to start messaging.
          </div>
        )}
      </Card>
    </div>
  );
}
