-- AlterTable: add overlay_color column to event_id_templates
ALTER TABLE "event_id_templates" ADD COLUMN "overlay_color" TEXT NOT NULL DEFAULT '#000000';
