export interface AdminBook {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  description: string | null;
  language: string | null;
  cover_asset_path: string | null;
  status: "draft" | "ready" | "published";
  created_at: string;
  updated_at: string;
  version_count: number;
  latest_version?: AdminBookVersion;
}

export interface AdminBookVersion {
  id: string;
  book_id: string;
  version_label: string;
  manifest_sha256: string | null;
  content_json: Record<string, unknown> | null;
  validation_status: "unvalidated" | "validating" | "validated";
  publication_status: "unpublished" | "published";
  published_at: string | null;
  created_at: string;
  validation_errors?: string[];
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface UploadResult {
  success: boolean;
  uploaded: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface AdminSession {
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  } | null;
  loading: boolean;
}