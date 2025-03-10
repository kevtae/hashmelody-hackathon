import { createClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from './types';

class SupabaseClient {
  private static instance: ReturnType<typeof createClient>;
  private static config: SupabaseConfig;

  private static initialize() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    this.config = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY
    };

    this.instance = createClient(this.config.url, this.config.key);
  }

  public static getClient() {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance;
  }
}

export const supabase = SupabaseClient.getClient();
