import { fromSSO } from '@aws-sdk/credential-provider-sso';
import { AttributeValue, DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-provider-ini';

export class DynamoCore {
  protected client: DynamoDBClient;

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

    const dynamodbConfig = {
      region: process.env.AWS_REGION,
    } as DynamoDBClientConfig;

    if (profileType === 'sso') {
      dynamodbConfig.credentials = fromSSO({ profile });
    }

    if (profileType === 'ini') {
      dynamodbConfig.credentials = fromIni({ profile });
    }
    

    this.client = new DynamoDBClient(dynamodbConfig);
  }
}

export interface IDynamoRepository {
  getRecords(pk: string): Promise<Record<string, AttributeValue>[]>;
  deleteRecord(pk: string, sk: string): Promise<boolean>;
}