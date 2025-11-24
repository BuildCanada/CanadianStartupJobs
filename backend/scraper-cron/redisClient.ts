import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error("Redis connection failed after 10 retries");
        return new Error("Redis connection failed");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err: Error) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.on("ready", () => {
  console.log("Redis Client Ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis Client Reconnecting");
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
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
    console.error("Failed to disconnect from Redis:", error);
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
      console.error(`Error getting key ${key}:`, error);
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
      console.error(`Error setting key ${key}:`, error);
      throw error;
    }
  },

  // Delete a key
  del: async (key: string | string[]): Promise<number> => {
    try {
      return await redisClient.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  },

  // Check if a key exists
  exists: async (key: string | string[]): Promise<number> => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  },

  // Set expiration on a key (in seconds)
  expire: async (key: string, seconds: number): Promise<boolean> => {
    try {
      return await redisClient.expire(key, seconds);
    } catch (error) {
      console.error(`Error setting expiration on key ${key}:`, error);
      throw error;
    }
  },

  // Get TTL (time to live) of a key
  ttl: async (key: string): Promise<number> => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
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
      console.error(`Error setting hash field ${key}:`, error);
      throw error;
    }
  },

  // Get a hash field
  hGet: async (key: string, field: string): Promise<string | undefined> => {
    try {
      return await redisClient.hGet(key, field);
    } catch (error) {
      console.error(`Error getting hash field ${key}.${field}:`, error);
      throw error;
    }
  },

  // Get all hash fields
  hGetAll: async (key: string): Promise<Record<string, string>> => {
    try {
      return await redisClient.hGetAll(key);
    } catch (error) {
      console.error(`Error getting all hash fields for ${key}:`, error);
      throw error;
    }
  },

  // Add to a set
  sAdd: async (key: string, ...members: string[]): Promise<number> => {
    try {
      return await redisClient.sAdd(key, members);
    } catch (error) {
      console.error(`Error adding to set ${key}:`, error);
      throw error;
    }
  },

  // Check if member is in set
  sIsMember: async (key: string, member: string): Promise<boolean> => {
    try {
      return await redisClient.sIsMember(key, member);
    } catch (error) {
      console.error(`Error checking set membership ${key}:`, error);
      throw error;
    }
  },

  // Get all members of a set
  sMembers: async (key: string): Promise<string[]> => {
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      console.error(`Error getting set members ${key}:`, error);
      throw error;
    }
  },

  // Push to a list (left)
  lPush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      return await redisClient.lPush(key, values);
    } catch (error) {
      console.error(`Error pushing to list ${key}:`, error);
      throw error;
    }
  },

  // Push to a list (right)
  rPush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      return await redisClient.rPush(key, values);
    } catch (error) {
      console.error(`Error pushing to list ${key}:`, error);
      throw error;
    }
  },

  // Pop from a list (left)
  lPop: async (key: string): Promise<string | null> => {
    try {
      return await redisClient.lPop(key);
    } catch (error) {
      console.error(`Error popping from list ${key}:`, error);
      throw error;
    }
  },

  // Get list length
  lLen: async (key: string): Promise<number> => {
    try {
      return await redisClient.lLen(key);
    } catch (error) {
      console.error(`Error getting list length ${key}:`, error);
      throw error;
    }
  },
};

