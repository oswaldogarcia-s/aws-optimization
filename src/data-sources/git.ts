import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default class GitExec {
  private repoName: string;
  private basePath: string;
  private workBranch: string;
  private commitMessage: string;
  private url: string;

  constructor(
    repoName: string,
    basePath = '/Users/luisoswaldogarciaochoa/removeLogs/',
    workBranch = 'feat/remove-logs',
    commitMessage = '[FEAT] remove logs'
  ) {
    this.repoName = repoName;
    this.basePath = path.resolve(basePath);
    this.workBranch = workBranch;
    this.commitMessage = commitMessage;
    this.url = 'https://github.com/ab-inbev-tech-maz/';
  }

  private runCommand(command: string, cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async cloneRepo() {
    const repoPath = path.join(this.basePath, this.repoName);
    try {
      if (fs.existsSync(repoPath)) {
        await this.runCommand(`git pull origin main`, repoPath);
      } else {
        await this.runCommand(`git clone ${this.url}${this.repoName} ${repoPath}`);
      }
    } catch (err) {
      console.error('Error cloning repo:', err);
    }
  }

  async createBranch() {
    const repoPath = path.join(this.basePath, this.repoName);
    try {
      await this.runCommand(`git checkout -b ${this.workBranch}`, repoPath);
    } catch {
      // Si ya existe la rama, solo cambiar
      await this.runCommand(`git checkout ${this.workBranch}`, repoPath);
    }
  }

  async commit() {
    const repoPath = path.join(this.basePath, this.repoName);
    try {
      await this.runCommand(`git add .`, repoPath);
      await this.runCommand(`git commit -m "${this.commitMessage}"`, repoPath);
    } catch (err) {
      console.error('Error committing changes:', err);
    }
  }

  async publish() {
    const repoPath = path.join(this.basePath, this.repoName);
    try {
      await this.runCommand(`git push --set-upstream origin ${this.workBranch}`, repoPath);
    } catch (err) {
      console.error('Error publishing branch:', err);
    }
  }
}
