import { AttributeValue, BatchWriteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoCore, IDynamoRepository } from './core';
import { awaiter } from "../../services";


export default class DynamoHopStoreProduct extends DynamoCore implements IDynamoRepository{
  private table = String(process.env.DYNAMODB_TABLE_STORE_PRODUCT);

  private franchise = process.env.STAGE === 'prod' ? 'hopmx' : 'hopmxstaging';
  
    async getRecords(store: string, retries = 0): Promise<Record<string, AttributeValue>[]> {
      try {
        let allItems: Record<string, AttributeValue>[] = [];
        let lastEvaluatedKey: Record<string, AttributeValue> | undefined = undefined;
        let iterationCount = 0;
  
        do {
          const params = {
            TableName: this.table,
            KeyConditionExpression: "pk = :store",
            ExpressionAttributeValues: {
              ":store": { S: 'STORE#' + this.franchise + store },
            },
            ProjectionExpression: "pk, sk",
            ExclusiveStartKey: lastEvaluatedKey
          };
          
          console.log('params: ', params);

          const response = await this.client.send(new QueryCommand(params));
  
          if (response.Items) {
            allItems = allItems.concat(response.Items);
          }
  
          lastEvaluatedKey = response.LastEvaluatedKey;
          iterationCount++;
  
        } while (lastEvaluatedKey && iterationCount < 20);
  
        return allItems;
  
      } catch (error: any) {
        if (error.message?.includes('exceeded')) {
          await awaiter(retries * 20 * 1000);
          return this.getRecords(store, retries + 1);
        }
        console.error('Error al obtener registros:', error);
        console.error('message: ', error.message);
        throw error;
      }
    }
  
  
    async deleteRecords(items: { pk: string, sk: string }[], retries = 0): Promise<boolean> {
      try {
        const deleteRequests = items.map((item) => ({
          DeleteRequest: {
            Key: {
              pk: { S: item.pk },
              sk: { S: item.sk }
            }
          }
        }));
  
        const params = {
          RequestItems: {
            [this.table]: deleteRequests
          }
        };
  
        await this.client.send(new BatchWriteItemCommand(params));
  
        return true;
      } catch (error: any) {
        if (error.message?.includes("exceeded")) {
          await new Promise(resolve => setTimeout(resolve, retries * 2000));
          return this.deleteRecords(items, retries + 1);
        }
        console.error("Error al borrar registros en batch:", error);
        throw error;
      }
    }
}