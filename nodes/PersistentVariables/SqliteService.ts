import * as path from 'path';
import * as fs from 'fs';

export interface VariableData {
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  createdAt: string;
  updatedAt: string;
}

export class SqliteService {
  private db: any = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Use provided path or default to a local file
    this.dbPath = dbPath || path.join(process.cwd(), 'persistent_variables.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Use the built-in sqlite3 module that's available in n8n
      const sqlite3 = require('sqlite3');
      
      this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // Create table if it doesn't exist
        this.db!.run(`
          CREATE TABLE IF NOT EXISTS variables (
            name TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json', 'date')),
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `, (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  async setVariable(name: string, value: any, type: 'string' | 'number' | 'boolean' | 'json' | 'date'): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      let serializedValue: string;

      // Serialize value based on type
      switch (type) {
        case 'string':
          serializedValue = String(value);
          break;
        case 'number':
          serializedValue = String(Number(value));
          break;
        case 'boolean':
          serializedValue = String(Boolean(value));
          break;
        case 'json':
          serializedValue = JSON.stringify(value);
          break;
        case 'date':
          serializedValue = new Date(value).toISOString();
          break;
        default:
          throw new Error(`Unsupported type: ${type}`);
      }

      this.db!.run(`
        INSERT OR REPLACE INTO variables (name, value, type, createdAt, updatedAt)
        VALUES (?, ?, ?, 
          COALESCE((SELECT createdAt FROM variables WHERE name = ?), ?),
          ?)
      `, [name, serializedValue, type, name, now, now], function(err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async getVariable(name: string): Promise<VariableData | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM variables WHERE name = ?',
        [name],
        (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }

  async getAllVariables(): Promise<VariableData[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM variables ORDER BY name',
        [],
        (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  }

  async deleteVariable(name: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(
        'DELETE FROM variables WHERE name = ?',
        [name],
        function(this: any, err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          this.db = null;
          resolve();
        });
      });
    }
  }

  deserializeValue(data: VariableData): any {
    switch (data.type) {
      case 'string':
        return data.value;
      case 'number':
        return Number(data.value);
      case 'boolean':
        return data.value === 'true';
      case 'json':
        return JSON.parse(data.value);
      case 'date':
        return new Date(data.value);
      default:
        return data.value;
    }
  }
}