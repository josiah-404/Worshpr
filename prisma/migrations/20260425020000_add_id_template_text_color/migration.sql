-- AlterTable: add text_color column to event_id_templates
ALTER TABLE "event_id_templates" ADD COLUMN "text_color" TEXT NOT NULL DEFAULT '#ffffff';
