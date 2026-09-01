import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'task-app-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
