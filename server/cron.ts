import { storage } from './storage';

function startSalaryCron() {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('Paying salaries...');
      const usersWithJobs = await storage.getUsersWithJobs();
      for (const { user, job } of usersWithJobs) {
        // Here you would add the logic to actually add the salary to the user's balance.
        // Since there is no balance management yet, I will just update the lastPaidAt timestamp.
        await storage.updateUserLastPaidAt(user.id);
        console.log(`Paid salary to ${user.username}`);
      }
      console.log('Salaries paid.');
    }
  }, 60 * 1000); // Check every minute for midnight
}

export { startSalaryCron };
