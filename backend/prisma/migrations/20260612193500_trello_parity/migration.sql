-- CreateEnum
CREATE TYPE "ListStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BoardRole" AS ENUM ('ADMIN', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "BoardVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('FILE', 'LINK');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BOARD_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BOARD_CLOSED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BOARD_REOPENED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORKSPACE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORKSPACE_MEMBER_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORKSPACE_MEMBER_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BOARD_MEMBER_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BOARD_MEMBER_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LIST_ARCHIVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LIST_RESTORED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LABEL_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LABEL_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DUE_DATE_SET';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DUE_DATE_CLEARED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'START_DATE_SET';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'ATTACHMENT_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'ATTACHMENT_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'COMMENT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'COMMENT_DELETED';

-- CreateTable workspaces (before boards.workspaceId FK)
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

CREATE TABLE "workspace_members" (
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspaceId","userId")
);

CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- Seed default workspace for existing data
INSERT INTO "workspaces" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('00000000-0000-4000-8000-000000000001', 'Personal', 'personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add workspace members for all existing users
INSERT INTO "workspace_members" ("workspaceId", "userId", "role", "joinedAt")
SELECT '00000000-0000-4000-8000-000000000001', "id", 'MEMBER', CURRENT_TIMESTAMP
FROM "users"
ON CONFLICT DO NOTHING;

-- Promote first user to workspace owner
UPDATE "workspace_members"
SET "role" = 'OWNER'
WHERE "workspaceId" = '00000000-0000-4000-8000-000000000001'
  AND "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1);

-- AlterTable boards - add nullable workspaceId first, backfill, then NOT NULL
ALTER TABLE "boards" ADD COLUMN "backgroundColor" TEXT;
ALTER TABLE "boards" ADD COLUMN "backgroundImageUrl" TEXT;
ALTER TABLE "boards" ADD COLUMN "isClosed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "boards" ADD COLUMN "visibility" "BoardVisibility" NOT NULL DEFAULT 'WORKSPACE';
ALTER TABLE "boards" ADD COLUMN "workspaceId" TEXT;

UPDATE "boards" SET "workspaceId" = '00000000-0000-4000-8000-000000000001' WHERE "workspaceId" IS NULL;

ALTER TABLE "boards" ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable activities
ALTER TABLE "activities" ADD COLUMN "metadata" JSONB;

-- AlterTable cards
ALTER TABLE "cards" ADD COLUMN "coverAttachmentId" TEXT;
ALTER TABLE "cards" ADD COLUMN "coverColor" TEXT;
ALTER TABLE "cards" ADD COLUMN "dueComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cards" ADD COLUMN "startDate" TIMESTAMP(3);

-- AlterTable checklist_items
ALTER TABLE "checklist_items" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "checklist_items" ADD COLUMN "dueDate" TIMESTAMP(3);

-- AlterTable comments
ALTER TABLE "comments" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable labels
ALTER TABLE "labels" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "labels" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable lists
ALTER TABLE "lists" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "lists" ADD COLUMN "status" "ListStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable board_members
CREATE TABLE "board_members" (
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BoardRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "board_members_pkey" PRIMARY KEY ("boardId","userId")
);

CREATE INDEX "board_members_userId_idx" ON "board_members"("userId");

-- Seed board members: owner as ADMIN for each existing board
INSERT INTO "board_members" ("boardId", "userId", "role", "joinedAt")
SELECT "id", "ownerId", 'ADMIN', CURRENT_TIMESTAMP
FROM "boards"
ON CONFLICT DO NOTHING;

-- CreateTable board_stars
CREATE TABLE "board_stars" (
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "board_stars_pkey" PRIMARY KEY ("userId","boardId")
);

CREATE INDEX "board_stars_userId_idx" ON "board_stars"("userId");

-- CreateTable attachments
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT,
    "filename" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attachments_cardId_idx" ON "attachments"("cardId");

-- DropIndex (replace with composite indexes)
DROP INDEX IF EXISTS "cards_listId_idx";
DROP INDEX IF EXISTS "checklist_items_checklistId_idx";
DROP INDEX IF EXISTS "lists_boardId_idx";

-- CreateIndex
CREATE INDEX "boards_workspaceId_idx" ON "boards"("workspaceId");
CREATE INDEX "card_labels_labelId_idx" ON "card_labels"("labelId");
CREATE INDEX "card_members_userId_idx" ON "card_members"("userId");
CREATE UNIQUE INDEX "cards_coverAttachmentId_key" ON "cards"("coverAttachmentId");
CREATE INDEX "cards_listId_position_idx" ON "cards"("listId", "position");
CREATE INDEX "checklist_items_checklistId_position_idx" ON "checklist_items"("checklistId", "position");
CREATE INDEX "lists_boardId_position_idx" ON "lists"("boardId", "position");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "boards" ADD CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "board_stars" ADD CONSTRAINT "board_stars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "board_stars" ADD CONSTRAINT "board_stars_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cards" ADD CONSTRAINT "cards_coverAttachmentId_fkey" FOREIGN KEY ("coverAttachmentId") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigram search index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "cards_title_trgm_idx" ON "cards" USING GIN ("title" gin_trgm_ops);
