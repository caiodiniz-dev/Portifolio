-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "paymentMethod" TEXT DEFAULT 'pix',
    "installments" INTEGER NOT NULL DEFAULT 1,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "totalAmount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "category", "createdAt", "date", "description", "id", "installmentNumber", "installments", "paymentMethod", "recurring", "recurringFrequency", "title", "totalInstallments", "type", "userId") SELECT "amount", "category", "createdAt", "date", "description", "id", "installmentNumber", "installments", "paymentMethod", "recurring", "recurringFrequency", "title", "totalInstallments", "type", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
