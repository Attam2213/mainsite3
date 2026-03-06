import { Client } from 'ssh2';
import { decrypt } from '../utils/crypto';

export const execCommand = (config: any, command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
            conn.end();
            return reject(err);
        }
        let output = '';
        stream.on('close', (code: any, signal: any) => {
          conn.end();
          resolve(output);
        }).on('data', (data: any) => {
          output += data;
        }).stderr.on('data', (data: any) => {
          console.error('STDERR: ' + data);
        });
      });
    }).on('error', (err) => {
        reject(err);
    }).connect(config);
  });
};

export const stopPM2Process = async (project: any) => {
    if (!project.serverIp || !project.sshUsername || !project.pm2ProcessName) return;
    
    try {
        const config = {
            host: project.serverIp,
            port: 22,
            username: project.sshUsername,
            password: project.sshPassword ? decrypt(project.sshPassword) : undefined
        };
        await execCommand(config, `pm2 stop ${project.pm2ProcessName}`);
        console.log(`Stopped PM2 process ${project.pm2ProcessName} on ${project.serverIp}`);
        
        // Update siteStatus locally if needed, but monitor service will update it eventually
    } catch (error) {
        console.error(`Failed to stop PM2 process for project ${project.id}:`, error);
    }
};

export const startPM2Process = async (project: any) => {
    if (!project.serverIp || !project.sshUsername || !project.pm2ProcessName) return;
    
    try {
        const config = {
            host: project.serverIp,
            port: 22,
            username: project.sshUsername,
            password: project.sshPassword ? decrypt(project.sshPassword) : undefined
        };
        await execCommand(config, `pm2 start ${project.pm2ProcessName} && pm2 save`);
        console.log(`Started PM2 process ${project.pm2ProcessName} on ${project.serverIp}`);
    } catch (error) {
        console.error(`Failed to start PM2 process for project ${project.id}:`, error);
    }
};
