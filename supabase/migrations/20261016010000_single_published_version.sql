-- Phase 10b: Add unique constraint for single published version per book
-- This enforces the database-level integrity rule that only one version
-- per book can be published at a time.

-- First, verify there are no existing conflicts in the data
-- (This will fail if conflicts exist, which is the desired behavior)

-- Create partial unique index: only one published version per book
create unique index if not exists book_versions_single_published_per_book
  on public.book_versions (book_id)
  where publication_status = 'published';

-- Note: This will prevent INSERT/UPDATE that would create a second
-- published version for the same book. Application should handle this
-- gracefully with user-friendly error messages.