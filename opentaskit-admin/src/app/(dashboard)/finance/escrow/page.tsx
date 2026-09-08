"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Filter,
} from "lucide-react";

import { MOCK_TRANSACTIONS, TransactionRecord } from "@/data/mock-data";
import { exportToCsv, CsvColumn } from "@/lib/export-csv";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EscrowLedgerPage() {
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [gatewayFilter, setGatewayFilter] = React.useState<string>("ALL");

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.taskTitle && t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    const matchesGateway = gatewayFilter === "ALL" || t.gateway === gatewayFilter;

    return matchesSearch && matchesType && matchesGateway;
  });

  const totalEscrowLocked = transactions
    .filter((t) => t.type === "ESCROW_LOCK" && t.status === "SUCCESS")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalReleased = transactions
    .filter((t) => t.type === "ESCROW_RELEASE" && t.status === "SUCCESS")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalRefunded = transactions
    .filter((t) => t.type === "ESCROW_REFUND" || t.status === "REFUNDED")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPlatformFees = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((acc, t) => acc + t.fee, 0);

  const handleExportCsv = () => {
    const columns: CsvColumn<TransactionRecord>[] = [
      { key: "id", label: "Transaction ID" },
      { key: "createdAt", label: "Date & Time" },
      { key: "type", label: "Transaction Type" },
      { key: (t) => t.taskId || "N/A", label: "Task ID" },
      { key: (t) => t.taskTitle || "N/A", label: "Task Title" },
      { key: "userName", label: "User Name" },
      { key: "userEmail", label: "User Email" },
      { key: "gateway", label: "Payment Gateway" },
      { key: "amount", label: "Amount (LKR)" },
      { key: "fee", label: "Platform Fee (LKR)" },
      { key: "status", label: "Status" },
    ];

    exportToCsv("opentaskit_escrow_ledger", filteredTransactions, columns);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Escrow Ledger & Gateway Transactions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit locked task escrows, completed payouts, automated gateway settlements, and platform fees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportCsv}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Ledger CSV</span>
          </Button>
        </div>
      </div>

      {/* Escrow Vault Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Escrow Held
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {totalEscrowLocked.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Safely locked in active tasks
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Released Provider Payouts
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {totalReleased.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
              Completed marketplace jobs
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Refunded to Posters
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {totalRefunded.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Cancelled / arbitrated refunds
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Fee Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              LKR {totalPlatformFees.toLocaleString()}
            </div>
            <span className="text-[11px] text-purple-600 mt-0.5 block font-medium">
              10% net service commission
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transaction ID, task title, user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ESCROW_LOCK">Escrow Lock</SelectItem>
                  <SelectItem value="ESCROW_RELEASE">Escrow Release</SelectItem>
                  <SelectItem value="ESCROW_REFUND">Escrow Refund</SelectItem>
                  <SelectItem value="CARD_PAYMENT">Card Payment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Gateways</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                  <SelectItem value="PAYHERE">PayHere</SelectItem>
                  <SelectItem value="CARD_ONLINE">Card Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Transactions Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Txn ID</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Type</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Task / Purpose</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">User</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap">Gateway</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Platform Fee</TableHead>
                  <TableHead className="text-xs font-semibold text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right whitespace-nowrap">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                      No transaction records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="font-mono font-semibold text-foreground whitespace-nowrap">
                        {txn.id}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            txn.type === "ESCROW_LOCK"
                              ? "bg-blue-500/10 text-blue-600"
                              : txn.type === "ESCROW_RELEASE"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : txn.type === "ESCROW_REFUND"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-purple-500/10 text-purple-600"
                          }`}
                        >
                          {txn.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap max-w-xs truncate text-foreground font-medium">
                        {txn.taskTitle || "Account Top-up / Card Payment"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{txn.userName}</span>
                          <span className="text-[11px] text-muted-foreground">{txn.userEmail}</span>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {txn.gateway}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap font-bold text-foreground">
                        LKR {txn.amount.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap font-semibold text-muted-foreground">
                        {txn.fee > 0 ? `LKR ${txn.fee.toLocaleString()}` : "—"}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={txn.status === "SUCCESS" ? "outline" : "secondary"}
                          className={`text-[10px] font-semibold ${
                            txn.status === "SUCCESS"
                              ? "text-emerald-600 border-emerald-500/30"
                              : txn.status === "REFUNDED"
                              ? "text-amber-600 border-amber-500/30"
                              : "text-muted-foreground"
                          }`}
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
