-- AlterTable: add photo_url to registrants
ALTER TABLE "registrants" ADD COLUMN "photo_url" TEXT;

-- CreateTable: event_id_templates
CREATE TABLE "event_id_templates" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "background_url" TEXT NOT NULL,
    "size_id" TEXT NOT NULL DEFAULT 'cr80',
    "layout_id" TEXT NOT NULL DEFAULT 'name-bottom-center',
    "layout_fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_id_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_id_templates_event_id_key" ON "event_id_templates"("event_id");

-- AddForeignKey
ALTER TABLE "event_id_templates" ADD CONSTRAINT "event_id_templates_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
