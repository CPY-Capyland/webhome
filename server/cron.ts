import cron from "node-cron";
import { storage } from "./storage";

export function startCronJobs() {
  // Run every hour to check for elections and laws that need closing
  // and to pay salaries if it's a new day
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly cron jobs...");
    try {
      // 1. Pay salaries (idempotent, only pays once per day)
      await storage.payAllSalaries();
      
      // 2. Advance election status if needed
      await storage.checkAndAdvanceElections();
      
      // 3. Close law voting if needed
      await storage.checkAndCloseLaws();
      
      console.log("Hourly cron jobs finished successfully.");
    } catch (error) {
      console.error("Error running hourly cron jobs:", error);
    }
  });

  // Also run once on startup
  console.log("Running initial cron tasks on startup...");
  storage.payAllSalaries().catch(err => console.error("Initial salary payment failed:", err));
  storage.checkAndAdvanceElections().catch(err => console.error("Initial election check failed:", err));
  storage.checkAndCloseLaws().catch(err => console.error("Initial law check failed:", err));
}
