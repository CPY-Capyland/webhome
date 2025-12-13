import { storage } from './storage';

function startSalaryCron() {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('Paying salaries...');
      const usersWithJobs = await storage.getUsersWithJobs();
      for (const { user, job } of usersWithJobs) {
        const netSalary = job.grossSalary + job.fees; // fees are negative, so addition works
        await storage.updateUserLastPaidAt(user.id);
        console.log(`Paid ${netSalary} to ${user.username}.`);
      }
      console.log('Salaries paid.');
    }
  }, 60 * 1000); // Check every minute for midnight
}

export { startSalaryCron };
