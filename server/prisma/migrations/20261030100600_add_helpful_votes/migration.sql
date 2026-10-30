CREATE TABLE "HelpfulVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpfulVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HelpfulVote_userId_reviewId_key" ON "HelpfulVote"("userId", "reviewId");
CREATE INDEX "HelpfulVote_reviewId_idx" ON "HelpfulVote"("reviewId");

ALTER TABLE "HelpfulVote"
ADD CONSTRAINT "HelpfulVote_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HelpfulVote"
ADD CONSTRAINT "HelpfulVote_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
