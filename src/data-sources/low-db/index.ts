import path from 'path';
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { stores } from '../../utils';

type Data = {
  orders: { lastDeleteDate: string },
  inventoryTracking: { lastStoreIndex: 0, lastStore: string },
  loyaltyTransactions: { lastStoreIndex: 0, lastStore: string },
  storeProduct: { lastStoreIndex: 0, lastStore: string },
}

export default class LowDb {
  private cutoffDate = new Date("2024-12-31T00:00:00Z");

  private filepath = path.join(process.cwd(), 'db.json');

  private adapter = new JSONFile<Data>(this.filepath)

  private defaultData: Data = {
    orders: { lastDeleteDate: this.cutoffDate.toISOString() },
    inventoryTracking: { lastStoreIndex: 0, lastStore: '' },
    loyaltyTransactions: { lastStoreIndex: 0, lastStore: '' },
    storeProduct: { lastStoreIndex: 0, lastStore: '' }
  }

  private db = new Low(this.adapter, this.defaultData)

  async getlastDeleteDate(dbName: string): Promise<Date> {
    try {
      await this.db.read();
      const fechaStr = this.db.data[dbName]?.lastDeleteDate;
      return new Date(fechaStr)
    } catch (error) {
      console.error('Error al obtener registros:', error);
      throw error;
    }
  }

  async setLastDeleteDate(dbName: string, fecha: Date): Promise<boolean> {
    try {
      await this.db.read();

      // if not exists create
      if (!this.db.data[dbName]) {
        throw new Error(`La base de datos "${dbName}" no existe.`);
      }

      // save date as isostring
      this.db.data[dbName].lastDeleteDate = fecha.toISOString();

      // write on disk
      await this.db.write();

      return true;
    } catch (error) {
      console.error('Error al guardar la fecha:', error);
      throw error;
    }
  }

  async getLastStoreIndex(dbName: string): Promise<{index: number, store: string}> {
    try {
      await this.db.read();
      const index = this.db.data[dbName]?.lastStoreIndex ?? 0;
      const store = stores[index];
      if(store === undefined){
        console.log('No hay más tiendas para procesar');
        process.exit(0);
      }
      return {index, store,};
    } catch (error) {
      console.error('Error al obtener registros:', error);
      throw error;
    }
  }

  async setLastStore(dbName: string, index: number): Promise<boolean> {
    try {
      await this.db.read();

      // if not exists create
      if (!this.db.data[dbName]) {
        throw new Error(`La base de datos "${dbName}" no existe.`);
      }

      // save date as isostring
      this.db.data[dbName].lastStoreIndex = index;
      this.db.data[dbName].lastStore = stores[index];
      // write on disk
      await this.db.write();

      return true;
    } catch (error) {
      console.error('Error al guardar la fecha:', error);
      throw error;
    }
  }
}