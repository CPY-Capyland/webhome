import cron from "node-cron";
import { storage } from "./storage";

export function startSalaryCron() {
  // Schedule a job to run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running salary payment cron job...");
    try {
      await storage.payAllSalaries();
      console.log("Salary payment cron job finished successfully.");
    } catch (error) {
      console.error("Error running salary payment cron job:", error);
    }
  });
}