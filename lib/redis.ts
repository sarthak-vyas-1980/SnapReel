import { Redis } from '@upstash/redis';

// This automatically reads the URL and TOKEN from your environment variables
export const redis = Redis.fromEnv();
