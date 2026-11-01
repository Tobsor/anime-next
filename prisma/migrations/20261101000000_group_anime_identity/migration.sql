BEGIN;

-- Preserve existing votes and associate them with their anime's group.
ALTER TABLE "Vote" ADD COLUMN "groupId" TEXT;
UPDATE "Vote" AS v SET "groupId" = a."groupId"
FROM "Anime" AS a WHERE a."id" = v."animeId";
ALTER TABLE "Vote" ALTER COLUMN "groupId" SET NOT NULL;

ALTER TABLE "Vote" DROP CONSTRAINT "Vote_animeId_fkey";
ALTER TABLE "Anime" DROP CONSTRAINT "Anime_pkey";
ALTER TABLE "Anime" ADD CONSTRAINT "Anime_pkey" PRIMARY KEY ("groupId", "id");
DROP INDEX "Vote_userId_animeId_key";
CREATE UNIQUE INDEX "Vote_groupId_userId_animeId_key" ON "Vote"("groupId", "userId", "animeId");
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_groupId_animeId_fkey"
FOREIGN KEY ("groupId", "animeId") REFERENCES "Anime"("groupId", "id")
ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
