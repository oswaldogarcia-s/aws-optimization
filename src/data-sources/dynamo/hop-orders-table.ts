/* eslint-disable prefer-arrow-callback */
import { AttributeValue, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoCore, IDynamoRepository } from './core';

export default class DynamoHopOrders extends DynamoCore implements IDynamoRepository {
  private table = String(process.env.DYNAMODB_TABLE_ORDERS);

  private indexName = 'gs2pk';

  async getRecords(gspk: string, retries = 0): Promise<Record<string, AttributeValue>[]> {
    try {
      const date = gspk;
      const params = {
        TableName: this.table,
        IndexName: this.indexName,
        KeyConditionExpression: "gs2pk = :fecha", // Solo Partition Key
        ExpressionAttributeValues: {
          ":fecha": { S: date }
        },
      };

      const response = await this.client.send(new QueryCommand(params));

      return response.Items ?? [];
    } catch (error) {
      if (error.message.includes('exceeded')) {
        await new Promise(resolve => setTimeout(resolve, retries * 20 * 1000));
        return this.getRecords(gspk, retries + 1);
      }
      console.error('Error al obtener registros:', error);
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
        await new Promise(resolve => setTimeout(resolve, retries * 20 * 1000));
        return this.deleteRecord(pk, sk, retries + 1);
      }
      console.error('Error al obtener registros:', error);
      throw error;
    }
  }
}
