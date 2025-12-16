import { db } from "../server/db";
import { houses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixExpansionUnits() {
  console.log("Starting to fix expansion units...");

  const allHouses = await db.select().from(houses);

  for (const house of allHouses) {
    const correctExpansionUnits = (house.size - 1) * 3;
    const currentExpansionUnits = (house.expansion as any[]).length;
    const availableExpansionUnits = correctExpansionUnits - currentExpansionUnits;

    if (house.expansionUnits !== availableExpansionUnits) {
      console.log(`Fixing house ${house.id} for user ${house.userId}.`);
      console.log(`  Size: ${house.size}`);
      console.log(`  Correct total units: ${correctExpansionUnits}`);
      console.log(`  Current placed units: ${currentExpansionUnits}`);
      console.log(`  Current available units in DB: ${house.expansionUnits}`);
      console.log(`  Setting available units to: ${availableExpansionUnits}`);
      
      await db.update(houses)
        .set({ expansionUnits: availableExpansionUnits })
        .where(eq(houses.id, house.id));
    }
  }

  console.log("Finished fixing expansion units.");
  process.exit(0);
}

fixExpansionUnits().catch((error) => {
  console.error("Error fixing expansion units:", error);
  process.exit(1);
});
