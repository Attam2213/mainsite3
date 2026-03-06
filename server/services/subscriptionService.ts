import { Project } from '../models';
import { stopPM2Process } from './sshService';
import { Op } from 'sequelize';

export const checkSubscriptions = async () => {
    try {
        const expiredProjects = await Project.findAll({
            where: {
                paidUntil: {
                    [Op.lt]: new Date() // expired
                },
                pm2ProcessName: { [Op.ne]: null } // has PM2 setup
            }
        });

        for (const project of expiredProjects) {
            console.log(`Project ${project.title} expired on ${project.paidUntil}. Stopping process...`);
            await stopPM2Process(project);
        }
    } catch (error) {
        console.error('Error checking subscriptions:', error);
    }
};

export const startSubscriptionService = () => {
    // Check every 1 minute (for testing)
    setInterval(checkSubscriptions, 60 * 1000);
    // Initial check
    checkSubscriptions();
};
