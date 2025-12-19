import {
  CognitoIdentityProviderClient,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  ListUsersCommandInput,
  ListUsersCommand,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import { ProgressBar } from '../../services';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class CognitoClient {
  private client: CognitoIdentityProviderClient;

  private userPoolID: string;

  private progressBar: ProgressBar;

  constructor() {
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION no está definido en las variables de entorno');
    }
    if (!process.env.AWS_PROFILE) {
      throw new Error('AWS_PROFILE no está definido en las variables de entorno');
    }
    if (!process.env.AWS_PROFILE_TYPE) {
      throw new Error('AWS_PROFILE_TYPE no está definido en las variables de entorno');
    }
    const profileType = process.env.AWS_PROFILE_TYPE;
    const profile = process.env.AWS_PROFILE;
    
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: profileType === 'ini' ? fromIni({ profile }) : fromSSO({ profile })
    });
    
    if(!process.env.USER_POOL_ID){
      throw new Error('USER_POOL_ID no está definido en las variables de entorno');
    }
    this.userPoolID = process.env.USER_POOL_ID;
  }

  async getUsers(
    filterValues: string[],
    attributeName: 'username' | 'email' = 'username',
  ) {
    try {
      let results: any[] = [];

      console.log('👤 Getting users...');

      const total = filterValues.length;
      let current = 0;

      this.progressBar = new ProgressBar(total, 50);

      for (const val of filterValues) {
        const command = new ListUsersCommand({
          UserPoolId: this.userPoolID,
          Filter: `${attributeName} = "${val}"`,
          Limit: 60
        });

        const response = await this.client.send(command);
        results = results.concat(response.Users || []);

        current += 1;
        const percent = current / total * 100;
        this.progressBar.update(current);
      }

      return results;

    } catch (error) {
      console.error('Error to get users: ', error);
      throw error;
    }
  }

  async disabledUsers(users: string[]) {
    try {
      const total = users.length;
      let current = 0;
      this.progressBar = new ProgressBar(total, 50);

      console.log('❌ Disabling users...');
      for (const user of users) {
        const command = new AdminDisableUserCommand({
          UserPoolId: this.userPoolID,
          Username: user
        });
        await this.client.send(command);
        await sleep(5000);
        current += 1;
        this.progressBar.update(current);
      }
    } catch (error) {
      console.error('Error to disable users: ', error);
      throw error;
    }
  }

  async enableUsers(users: string[]) {
    try {
      const total = users.length;
      let current = 0;
      this.progressBar = new ProgressBar(total, 50);
      
      console.log('✅ Enabling users...');
      for (const user of users) {
        const command = new AdminEnableUserCommand({
          UserPoolId: this.userPoolID,
          Username: user
        });
        await this.client.send(command);
        await sleep(5000);
        current += 1;
        this.progressBar.update(current);
      }
    } catch (error) {
      console.error('Error to enable users: ', error);
      throw error;
    }
  }
}