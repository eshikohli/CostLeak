-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "recommendedFix" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "estimatedBeforeCost" TEXT NOT NULL DEFAULT '',
    "estimatedAfterCost" TEXT NOT NULL DEFAULT '',
    "estimatedSavings" TEXT NOT NULL DEFAULT '',
    "estimationNote" TEXT NOT NULL DEFAULT '',
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedRecommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedRecommendation" ("analysisId", "createdAt", "expectedImpact", "id", "issue", "recommendedFix", "saved") SELECT "analysisId", "createdAt", "expectedImpact", "id", "issue", "recommendedFix", "saved" FROM "SavedRecommendation";
DROP TABLE "SavedRecommendation";
ALTER TABLE "new_SavedRecommendation" RENAME TO "SavedRecommendation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
