import sqlite3 from 'sqlite3';
import path from 'path';
import type { User } from '@easylegal/common';

const DB_PATH = path.join(__dirname, '../../data/easylegal.db');

class Database {
  private db: sqlite3.Database | null = null;

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create users table
        this.db!.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Insert the 2 authorized users if they don't exist
          this.initializeUsers()
            .then(() => resolve())
            .catch(reject);
        });
      });
    });
  }

  /**
   * Initialize the 2 authorized users
   * IMPORTANT: Update these with your actual email addresses
   */
  private async initializeUsers(): Promise<void> {
    const authorizedUsers = [
      { email: 'frederik@agicon.be', name: 'Frederik' },
      { email: 'pascale@easylegal.be', name: 'Pascale' },
    ];

    for (const user of authorizedUsers) {
      await this.addUser(user.email, user.name);
    }
  }

  /**
   * Add a user (if not exists)
   */
  async addUser(email: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(
        'INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)',
        [email, name],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row: User | undefined) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM users ORDER BY id',
        (err, rows: User[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * Check if user is authorized
   */
  async isAuthorized(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const database = new Database();
