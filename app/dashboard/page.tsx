"use client"

import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { createAuthFetcher } from "@/lib/fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types"
import type { UserRole } from "@/lib/types"
import { FileText, Users, ClipboardList, ShieldCheck, Clock, Activity } from "lucide-react"

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-card-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    upload: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    view: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    verify: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    role_change: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  return (
    <Badge variant="outline" className={colors[action] || "bg-muted text-muted-foreground"}>
      {action}
    </Badge>
  )
}

export default function DashboardPage() {
  const { token, user } = useAuth()
  const fetcher = createAuthFetcher(token)
  const { data: stats, isLoading } = useSWR(token ? "/api/stats" : null, fetcher)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Loading overview...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Welcome back, {user?.username}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {"Here's an overview of your encrypted document workspace."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={stats?.documents ?? 0}
          description="Encrypted documents stored"
          icon={FileText}
        />
        <StatCard
          title="Active Users"
          value={stats?.users ?? 0}
          description="Registered platform users"
          icon={Users}
        />
        <StatCard
          title="Audit Entries"
          value={stats?.audit_entries ?? 0}
          description="Total access logs recorded"
          icon={ClipboardList}
        />
        <StatCard
          title="Verified on Chain"
          value={stats?.verified_documents ?? 0}
          description="Blockchain-verified documents"
          icon={ShieldCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.recent_activity.map(
                  (
                    activity: {
                      action: string
                      username: string
                      document_name: string
                      created_at: string
                    },
                    idx: number
                  ) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ActionBadge action={activity.action} />
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{activity.username}</p>
                          <p className="text-xs text-muted-foreground">{activity.document_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-4 w-4 text-primary" />
              Role Distribution
            </CardTitle>
            <CardDescription>User breakdown by role</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.role_distribution && stats.role_distribution.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.role_distribution.map(
                  (item: { role: UserRole; count: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={ROLE_COLORS[item.role] || "bg-muted text-muted-foreground"}
                        >
                          {ROLE_LABELS[item.role] || item.role}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-card-foreground">{item.count}</span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
