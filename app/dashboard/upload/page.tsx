"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileText, Columns, Shield, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Step = "name" | "data" | "roles" | "review"
type ColumnConfig = { name: string; allowed_roles: string[] }

const ALL_ROLES = ["admin", "teacher", "student", "office"]

export default function UploadPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>("name")
  const [documentName, setDocumentName] = useState("")
  const [rawData, setRawData] = useState("")
  const [parsedColumns, setParsedColumns] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([])
  const [uploading, setUploading] = useState(false)

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return
    const headers = lines[0].split(",").map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = values[i] || ""
      })
      return row
    })
    setParsedColumns(headers)
    setParsedData(rows)
    setColumnConfigs(headers.map((h) => ({ name: h, allowed_roles: ["admin"] })))
  }, [])

  function toggleRole(colName: string, role: string) {
    setColumnConfigs((prev) =>
      prev.map((c) => {
        if (c.name !== colName) return c
        const has = c.allowed_roles.includes(role)
        return {
          ...c,
          allowed_roles: has
            ? c.allowed_roles.filter((r) => r !== role)
            : [...c.allowed_roles, role],
        }
      })
    )
  }

  async function handleUpload() {
    if (!token) return
    setUploading(true)
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_name: documentName,
          columns: columnConfigs,
          data: parsedData,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }
      const result = await res.json()
      toast.success("Document uploaded and encrypted successfully", {
        description: result.tx_hash
          ? `Blockchain TX: ${result.tx_hash.slice(0, 20)}...`
          : undefined,
      })
      router.push("/dashboard/documents")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const steps: { key: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "name", label: "Name", icon: FileText },
    { key: "data", label: "Data", icon: Upload },
    { key: "roles", label: "Roles", icon: Shield },
    { key: "review", label: "Review", icon: Check },
  ]
  const stepIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Upload Document</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Encrypt and store a document with column-level role access
        </p>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                i <= stepIdx
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {step === "name" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Document Name</CardTitle>
            <CardDescription>Give your document a descriptive name</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="docName" className="text-card-foreground">Name</Label>
              <Input
                id="docName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Student Grades Q1 2026"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={() => setStep("data")}
              disabled={!documentName.trim()}
              className="w-fit"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "data" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Paste CSV Data</CardTitle>
            <CardDescription>
              Paste comma-separated data with headers on the first line
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <textarea
              value={rawData}
              onChange={(e) => {
                setRawData(e.target.value)
                parseCSV(e.target.value)
              }}
              placeholder={`name,grade,student_id\nAlice,A,STU-001\nBob,B+,STU-002`}
              rows={8}
              className="w-full rounded-lg border border-border bg-muted p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {parsedColumns.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Detected {parsedColumns.length} columns, {parsedData.length} rows
                </p>
                <div className="flex gap-2 flex-wrap">
                  {parsedColumns.map((col) => (
                    <Badge key={col} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Columns className="h-3 w-3 mr-1" />
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("name")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("roles")}
                disabled={parsedColumns.length === 0 || parsedData.length === 0}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "roles" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Column Access Roles</CardTitle>
            <CardDescription>
              Assign which roles can see each column. Unselected roles will see ACCESS_DENIED.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Column</TableHead>
                    {ALL_ROLES.map((role) => (
                      <TableHead key={role} className="text-muted-foreground text-center capitalize">
                        {role}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnConfigs.map((col) => (
                    <TableRow key={col.name} className="border-border">
                      <TableCell className="font-medium text-card-foreground">{col.name}</TableCell>
                      {ALL_ROLES.map((role) => (
                        <TableCell key={role} className="text-center">
                          <Checkbox
                            checked={col.allowed_roles.includes(role)}
                            onCheckedChange={() => toggleRole(col.name, role)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("data")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep("review")}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Review & Encrypt</CardTitle>
            <CardDescription>
              Confirm your document details before encrypting and storing on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Document Name</p>
                <p className="text-sm font-medium text-card-foreground">{documentName}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Uploaded By</p>
                <p className="text-sm font-medium text-card-foreground">{user?.username} ({user?.role})</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Columns</p>
                <p className="text-sm font-medium text-card-foreground">{parsedColumns.length}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Rows</p>
                <p className="text-sm font-medium text-card-foreground">{parsedData.length}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">Role Access Matrix</p>
              <div className="flex flex-col gap-1.5">
                {columnConfigs.map((col) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs">
                    <span className="text-card-foreground font-mono w-32 truncate">{col.name}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex gap-1 flex-wrap">
                      {col.allowed_roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[10px] py-0 bg-primary/10 text-primary border-primary/20">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("roles")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Encrypting & Storing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Encrypt & Upload
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
