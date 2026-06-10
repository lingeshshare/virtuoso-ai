-- Phase 7: Update reference_materials to match the upload API schema.
-- If running on a fresh DB, migration 001 already created the table — this alters it.
-- If the table matches already, all these are safe no-ops.

-- Add file_name column (display name of uploaded file)
alter table reference_materials
  add column if not exists file_name text not null default '';

-- Add file_type column (pdf, musicxml, mxl, midi) — separate from material_type
alter table reference_materials
  add column if not exists file_type text not null default 'pdf';

-- Add material_type column (score, excerpt, audition_packet)
alter table reference_materials
  add column if not exists material_type text not null default 'score';

-- Rename the old 'type' column to a legacy alias if it exists; new code uses file_type
-- We keep 'type' in place and just ensure file_type / material_type exist.
-- No drop: backward compatible.

-- Update the type check constraint to allow the full set used by the upload API
-- (safe to run even if constraint doesn't exist yet)
alter table reference_materials
  drop constraint if exists reference_materials_type_check;

-- Add updated constraint on material_type
alter table reference_materials
  drop constraint if exists reference_materials_material_type_check;

alter table reference_materials
  add constraint reference_materials_material_type_check
    check (material_type in ('score', 'excerpt', 'audition_packet'));
