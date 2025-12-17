/* eslint-disable prefer-arrow-callback */
import { AttributeValue, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoCore, IDynamoRepository } from './core';
import { stores } from '../../utils';
import { awaiter, ProgressBar } from '../../services';

export default class DynamoHopOrders extends DynamoCore implements IDynamoRepository {
  private table = String(process.env.DYNAMODB_TABLE_STORE_INVENTORY_TRACKING);

  private indexName = 'gs1';

  private franchise = process.env.STAGE === 'prod' ? 'hopmx' : 'hopmxstaging';

  async getRecords(store: string, retries = 0): Promise<Record<string, AttributeValue>[]> {
    try {
      const params = {
        TableName: this.table,
        IndexName: this.indexName,
        KeyConditionExpression: "gs1pk = :store AND gs1sk <= :fecha ",
        ExpressionAttributeValues: {
          ":store": { S: 'STORE#' + this.franchise + store },
          ":fecha": { S: 'AT#' + '2024-31-12' }
        },
      };

      const response = await this.client.send(new QueryCommand(params));

      return response.Items ?? [];
    } catch (error) {
      if (error.message.includes('exceeded')) {
        await awaiter(retries * 20 * 1000);
        return this.getRecords(store, retries + 1);
      }
      console.error('Error al obtener registros:', error);
      console.error('message: ', error.message);
      throw error;
    }
  }

  async deleteRecord(pk: string, sk: string, retries = 0): Promise<boolean> {
    try {
      const params = {
        TableName: this.table,
        Key: {
          pk: { S: pk },
          sk: { S: sk }
        }
      }

      await this.client.send(new DeleteItemCommand(params));
      return true;
    } catch (error) {
      if (error.message.includes('exceeded')) {
        await awaiter(retries * 20 * 1000);
        return this.deleteRecord(pk, sk, retries + 1);
      }
      console.error('Error al eliminar registros:', error);
      throw error;
    }
  }
}
