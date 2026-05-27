-- Fix invite_tokens: scope_type and scope_id should be nullable
-- (global-scope invites don't need a scope)
alter table invite_tokens
  alter column scope_type drop not null,
  alter column scope_id   drop not null;

-- Create documents storage bucket for file uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ]
);

-- Allow authenticated users to upload
create policy "documents_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

-- Allow anyone to read (bucket is public)
create policy "documents_read"
  on storage.objects for select
  to public
  using (bucket_id = 'documents');

-- Allow uploader to delete their own file
create policy "documents_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and auth.uid() = owner);

-- Add optional file attachment to meeting notes
alter table meeting_notes add column if not exists attachment_url text;
