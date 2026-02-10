import { RdsAdmin } from "../data-sources";
import { scanntechStoresIds } from "../utils";
import fs from 'fs';

export default class GetActiveStoresWithScantechID {
  private db: RdsAdmin;
  constructor() {
    this.db = new RdsAdmin();
  }

  async run() {
    try {
      const activeStores = await this.db.getStoreActive();
      const activeStoresWithScantechID: {
        StoreID: string;
        Name: string;
        Local: string;
      }[] = [];

      activeStores.forEach((data) => {
        const obj = {
          ...data,
          Local: scanntechStoresIds[data.StoreID],
        }
        activeStoresWithScantechID.push(obj);
      })
     

      // Mapping json to csv string with tittles
      const csvContent = activeStoresWithScantechID.reduce((acc, store) => {
        const { StoreID, Name, Local } = store;
        return acc + `${StoreID},${Name},${Local}\n`;
      }, 'StoreID,Name,Local\n');

      // Save csvContent into file.csv
      fs.writeFileSync('./stores-with-scantech-id.csv', csvContent);
    } catch (error) {
      console.error('Error in DisableClubModelorama: ', error);
      throw error;
    } finally {
      this.db.closeConnection();
    }
  }
}