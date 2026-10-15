import { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { getSupabase } from "@/lib/supabase";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, palette, space, radius } from "@/components/ui";
import type { AdminAuditLog } from "@/types";

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data as AdminAuditLog[]);
    } catch (error) {
      console.error("Audit log fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "moss";
      case "update": return "gold";
      case "publish": return "accent";
      case "unpublish": return "warning";
      case "delete": return "danger";
      case "upload_assets": return "accent";
      case "validate": return "gold";
      default: return "default";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "book": return "📚";
      case "book_version": return "📄";
      default: return "📋";
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading audit log…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.header}>
          <Eyebrow>Book People Admin</Eyebrow>
          <Title>Audit Log</Title>
          <Body>Recent administrative actions. Limited to 100 most recent entries.</Body>
        </View>

        {logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No audit entries yet.</Text>
            <Caption>Admin actions will appear here.</Caption>
          </Card>
        ) : (
          <View style={styles.logList}>
            {logs.map((log) => (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logIcon}>
                    <Text style={styles.iconText}>{getResourceIcon(log.resource_type)}</Text>
                  </View>
                  <View style={styles.logInfo}>
                    <View style={styles.logTitleRow}>
                      <Text style={styles.logAction}>
                        <Badge tone={getActionColor(log.action)}>{log.action}</Badge>
                      </Text>
                      <Text style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.logResource}>
                      {log.resource_type}: {log.resource_id.slice(0, 8)}…
                    </Text>
                    <Text style={styles.logAdmin}>By: {log.admin_user_id.slice(0, 8)}…</Text>
                  </View>
                </View>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <View style={styles.logMetadata}>
                    <Text style={styles.metadataLabel}>Metadata:</Text>
                    <Text style={styles.metadataValue}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: palette.muted,
    fontSize: 16,
  },
  header: {
    gap: space.xs,
    marginBottom: space.md,
  },
  emptyCard: {
    alignItems: "center",
    padding: space.xl,
    gap: space.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.ink,
  },
  logList: {
    gap: space.sm,
  },
  logCard: {
    padding: space.md,
  },
  logHeader: {
    flexDirection: "row",
    gap: space.md,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.medium,
    backgroundColor: palette.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  logInfo: {
    flex: 1,
    gap: space.xxs,
  },
  logTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logAction: {},
  logTime: {
    fontSize: 12,
    color: palette.muted,
    fontFamily: "monospace",
  },
  logResource: {
    fontSize: 13,
    color: palette.ink,
    fontFamily: "monospace",
  },
  logAdmin: {
    fontSize: 12,
    color: palette.muted,
  },
  logMetadata: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: space.xs,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
  },
  metadataValue: {
    fontFamily: "monospace",
    fontSize: 11,
    color: palette.ink,
    backgroundColor: palette.paper,
    padding: space.sm,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: palette.border,
  },
});