import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        return new Error("Redis connection failed");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err: Error) => {
  // Redis Client Error
});

redisClient.on("connect", () => {
  // Redis Client Connected
});

redisClient.on("ready", () => {
  // Redis Client Ready
});

redisClient.on("reconnecting", () => {
  // Redis Client Reconnecting
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    throw error;
  }
};

// Export the client for direct use
export { redisClient };

// Helper functions for common operations
export const redisHelpers = {
  // Get a value by key
  get: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.get(key);
    } catch (error) {
      throw error;
    }
  },

  // Set a value with optional expiration (in seconds)
  set: async (
    key: string,
    value: string,
    options?: { EX?: number; NX?: boolean; XX?: boolean }
  ): Promise<string | null> => {
    try {
      const setOptions: { EX?: number; NX?: boolean; XX?: boolean } = {};
      if (options?.EX !== undefined) setOptions.EX = options.EX;
      if (options?.NX !== undefined) setOptions.NX = options.NX;
      if (options?.XX !== undefined) setOptions.XX = options.XX;
      
      if (Object.keys(setOptions).length > 0) {
        return await redisClient.set(key, value, setOptions);
      }
      return await redisClient.set(key, value);
    } catch (error) {
      throw error;
    }
  },

  // Delete a key
  del: async (key: string | string[]): Promise<number> => {
    try {
      return await redisClient.del(key);
    } catch (error) {
      throw error;
    }
  },

  // Check if a key exists
  exists: async (key: string | string[]): Promise<number> => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      throw error;
    }
  },

  // Set expiration on a key (in seconds)
  expire: async (key: string, seconds: number): Promise<boolean> => {
    try {
      return await redisClient.expire(key, seconds);
    } catch (error) {
      throw error;
    }
  },

  // Get TTL (time to live) of a key
  ttl: async (key: string): Promise<number> => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      throw error;
    }
  },

  // Set a hash field
  hSet: async (
    key: string,
    field: string | Record<string, string>,
    value?: string
  ): Promise<number> => {
    try {
      if (typeof field === "string" && value !== undefined) {
        return await redisClient.hSet(key, field, value);
      } else if (typeof field === "object") {
        return await redisClient.hSet(key, field);
      } else {
        throw new Error("Invalid arguments for hSet");
      }
    } catch (error) {
      throw error;
    }
  },

  // Get a hash field
  hGet: async (key: string, field: string): Promise<string | undefined> => {
    try {
      return await redisClient.hGet(key, field);
    } catch (error) {
      throw error;
    }
  },

  // Get all hash fields
  hGetAll: async (key: string): Promise<Record<string, string>> => {
    try {
      return await redisClient.hGetAll(key);
    } catch (error) {
      throw error;
    }
  },

  // Add to a set
  sAdd: async (key: string, ...members: string[]): Promise<number> => {
    try {
      return await redisClient.sAdd(key, members);
    } catch (error) {
      throw error;
    }
  },

  // Check if member is in set
  sIsMember: async (key: string, member: string): Promise<boolean> => {
    try {
      return await redisClient.sIsMember(key, member);
    } catch (error) {
      throw error;
    }
  },

  // Get all members of a set
  sMembers: async (key: string): Promise<string[]> => {
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      throw error;
    }
  },

  // Push to a list (left)
  lPush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      return await redisClient.lPush(key, values);
    } catch (error) {
      throw error;
    }
  },

  // Push to a list (right)
  rPush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      return await redisClient.rPush(key, values);
    } catch (error) {
      throw error;
    }
  },

  // Pop from a list (left)
  lPop: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.lPop(key);
    } catch (error) {
      throw error;
    }
  },

  // Get list length
  lLen: async (key: string): Promise<number> => {
    try {
      return await redisClient.lLen(key);
    } catch (error) {
      throw error;
    }
  },
};

