import React from "react";
import type { VietQRData } from "./vietqrParser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Banknote, FileText } from "lucide-react";
import banksData from "./data/banks.json";

interface VietQRDisplayProps {
  data: VietQRData;
}

interface BankInfo {
  key: string;
  name: string;
  code: string;
  shortName: string;
  bin: string;
  thumb?: string;
  bgUrl?: string;
  accentColor?: string;
}

const DataRow = ({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-0">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value || "N/A"}</span>
  </div>
);

export const VietQRDisplay: React.FC<VietQRDisplayProps> = ({ data }) => {
  const formatAmount = (amount: string | null): string => {
    if (!amount) return "N/A";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(parseInt(amount, 10));
    } catch {
      return amount;
    }
  };

  const getBankInfo = (bin: string): BankInfo | null => {
    const banks = banksData as BankInfo[];
    return banks.find(bank => bank.bin === bin) || null;
  };

  const bankInfo = getBankInfo(data.accountBankBin);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Bank Information
            </CardTitle>
            {bankInfo && (
              <CardDescription className="flex items-center gap-2 mt-2">
                {bankInfo.thumb && (
                  <img src={bankInfo.thumb} alt={bankInfo.shortName} className="h-6 w-6 object-contain" />
                )}
                <span className="font-medium">{bankInfo.name}</span>
                <Badge variant="secondary" className="text-xs">{bankInfo.code}</Badge>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-0">
            <DataRow label="Bank BIN (38-00)" value={data.accountBankBin} />
            {bankInfo ? (
              <>
                <DataRow label="Bank Name" value={bankInfo.name} />
                <DataRow label="Short Name" value={bankInfo.shortName} />
                <DataRow label="Code" value={bankInfo.code} />
              </>
            ) : (
              <div className="py-2 border-b">
                <Badge variant="outline" className="text-xs">Bank not found in database</Badge>
              </div>
            )}
            <DataRow label="Account Number (38-01)" value={data.accountNumber} mono />
            <DataRow label="Account Type (38-02)" value={data.accountType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DataRow label="Method (01)" value={data.method === "11" ? "Static (11)" : "Dynamic (12)"} />
            <DataRow label="Currency (53)" value={`VND (704)`} />
            <DataRow label="Amount (54)" value={formatAmount(data.amount)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DataRow label="Country (58)" value={data.country} />
            <DataRow label="Payload Format (00)" value={data.payloadFormat} />
            {data.note && <DataRow label="Note (62-08)" value={data.note} />}
            {data.crc && <DataRow label="CRC (63)" value={data.crc} mono />}
          </CardContent>
        </Card>
      </div>

      {data.rawFields.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw Field Data</CardTitle>
            <CardDescription>Complete field breakdown for debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-25">Field ID</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(data.rawFields.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono font-medium">{key}</TableCell>
                        <TableCell className="font-mono text-sm break-all">{value}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
