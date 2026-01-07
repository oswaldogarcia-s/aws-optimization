import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { DynamoInventoryTracking, DynamoOrders, IDynamoRepository, LowDb, DynamoStoreProduct } from "../data-sources";
import { awaiter, ProgressBar } from "../services";

export default class HopOrdersTable {
  private dynamoClient: IDynamoRepository;

  private lowDB: LowDb;

  private lowDBPath = 'hopOrders';

  private lastDeleteDate: Date;

  private lastStore: string;

  private lastStoreIndex: number;

  private records: Record<string, AttributeValue>[] = [];

  private progressBar: ProgressBar;

  private async getRecordsFromDate() {
    try {
      const date = this.lastDeleteDate.toISOString().split('T')[0]
      this.records = await this.dynamoClient.getRecords(date);
      if (this.records.length < 1) {
        console.log('\n');
        console.log('No hay registros para la fecha: ', this.lastDeleteDate);
        await this.subtractDay();
        await this.getRecordsFromDate();
      }
    } catch (error) {
      console.error('Error al obtener registros:', error);
      throw error;
    }
  }

  private async getRecordsFromStore() {
    this.records = await this.dynamoClient.getRecords(this.lastStore);
    if (this.records.length < 1) {
      console.log('\n');
      console.log('No hay registros para la tienda: ', this.lastStore, 'index: ', this.lastStoreIndex);
      await this.setLastStore(this.lastStoreIndex + 1);
      await this.getLastStore();
      await this.getRecordsFromStore();
    }
  }


  private async deleteRecords() {
    console.log('\n');

    if (this.lastDeleteDate) {
      console.log('Borrando registros para la fecha: ', this.lastDeleteDate);
    }
    if (this.lastStore) {
      console.log('Borrando registros de la tienda: ', this.lastStore);
    }

    console.log('Registros por eliminar: ', this.records.length);
    this.progressBar = new ProgressBar(this.records.length);

    let x = 0;
    const batchSize = 20 * 25; // cantidad por segundo

    while (this.records.length > 0) {
      // Tomar un lote de hasta 50 registros
      const batch = this.records.splice(0, batchSize);

      const promises = [];
      // Dividir el lote grande en sublotes de máximo 25
      for (let i = 0; i < batch.length; i += 25) {
        const subBatch = batch.slice(i, i + 25).map(record => ({
          pk: record.pk.S!,
          sk: record.sk.S!
        }));

        // Llamar a deleteRecord con el arreglo de 25 items
        const promise = this.dynamoClient.deleteRecords(subBatch);
        promises.push(promise);

      }

      await Promise.all(promises);

      x += batch.length;
      this.progressBar.update(x);

      // Esperar 1 segundo antes del siguiente lote
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async getLastDeleteDate(): Promise<void> {
    this.lastDeleteDate = await this.lowDB.getlastDeleteDate(this.lowDBPath);
  }

  private async getLastStore(): Promise<void> {
    const response = await this.lowDB.getLastStoreIndex(this.lowDBPath);
    this.lastStore = response.store;
    this.lastStoreIndex = response.index;
  }


  private async subtractDay() {
    this.lastDeleteDate.setDate(this.lastDeleteDate.getDate() - 1);
    if (this.lastDeleteDate < new Date('2021-01-01')) {
      console.log('No hay registros para eliminar fecha: ', this.lastDeleteDate);
      process.exit(0);
    }
    await this.lowDB.setLastDeleteDate(this.lowDBPath, this.lastDeleteDate);
  }

  private async setLastStore(index: number) {
    await this.lowDB.setLastStore(this.lowDBPath, index);
  }

  async deleteOrders() {
    this.dynamoClient = new DynamoOrders();
    this.lowDBPath = 'orders';
    this.lowDB = new LowDb();
    try {
      if (!this.lastDeleteDate) {
        await this.getLastDeleteDate();
      }

      if (this.records.length < 1) {
        await this.getRecordsFromDate();
      }

      await this.deleteRecords();

      if (this.records.length < 1) {
        console.log('Esperando 2 segundos para volver a traer mas registros');
        awaiter(1000 * 2);
        await this.deleteOrders();
      }

    } catch (error) {
      console.error('Error process:', error);
      throw error;
    }
  }

  async deleteInventoryTracking() {
    this.dynamoClient = new DynamoInventoryTracking();
    this.lowDBPath = 'inventoryTracking';
    this.lowDB = new LowDb();
    try {
      if (!this.lastStore) {
        await this.getLastStore();
      }

      if (this.records.length < 1) {
        await this.getRecordsFromStore();
      }

      await this.deleteRecords();

      if (this.records.length < 1) {
        console.log('Esperando 2 segundos para volver a traer mas registros');
        awaiter(1000 * 2);
        await this.deleteInventoryTracking();
      }

    } catch (error) {
      console.error('Error process:', error);
      throw error;
    }
  }

  async deleteStoreProduct() {
    this.dynamoClient = new DynamoStoreProduct();
    this.lowDBPath = 'storeProduct';
    this.lowDB = new LowDb();
    try {
      if (!this.lastStore) {
        await this.getLastStore();
      }

      if (this.records.length < 1) {
        await this.getRecordsFromStore();
      }

      await this.deleteRecords();

      if (this.records.length < 1) {
        console.log('Esperando 2 segundos para volver a traer mas registros');
        awaiter(1000 * 2);
        await this.deleteStoreProduct();
      }

    } catch (error) {
      console.error('Error process:', error);
      throw error;
    }
  }
}