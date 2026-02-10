import 'mysql2';
import { knex, Knex } from 'knex';

export default class RdsAdmin {
  /** knex instance to perform database operations */
  protected db!: Knex;

  protected trx?: Knex.Transaction;

  protected async ensureDB(): Promise<void> {
    try {
      if (this.db !== undefined) {
        return;
      }

      const connection: Knex.MySql2ConnectionConfig = {
        host: process.env.HOP_ADMIN_DB_URL_PROXY,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASS,
        database: process.env.HOP_ADMIN_DB,
        charset: 'utf8',
        debug: false,
        timezone: '+00:00',
        ssl: { rejectUnauthorized: false },
        port: Number(process.env.HOP_ADMIN_DB_PORT)
      };
      const knexConfig: Knex.Config = {
        client: 'mysql2',
        connection,
      };
      this.db = knex(knexConfig);
    } catch (error) {
      console.error('ensureDB error: ', error);
      throw error;
    }
  }

  async disableClubModelorama(){
    try {
      await this.ensureDB();

      const query = this.db.raw(`
        UPDATE
          hopadmindb.PaymentAffiliation
        set StatusID = 0, PrevStatus = 1, LastUpdatedAt = now(), LastUpdatedBy = 'off'
        WHERE
          PaymentProviderID = 4
          AND StatusID = 1;
      `);

      await query;
    } catch (error) {
      console.error('disableClubModelorama error: ', error);
      throw error;
    }
  }

  async rollBackDisableClubModelorama(){
    try {
      await this.ensureDB();

      const query = this.db.raw(`
        UPDATE
          hopadmindb.PaymentAffiliation
        set StatusID = 1, PrevStatus = 0, LastUpdatedAt = now(), LastUpdatedBy = 'off'
        WHERE
          PaymentProviderID = 4
          AND StatusID = 0
          AND LastUpdatedBy = 'off';
      `);

      await query;
    } catch (error) {
      console.error('rollBackDisableClubModelorama error: ', error);
      throw error;
    }
  }

  async getStoreActive(): Promise<{StoreID: string, Name: string}[]>{
    try{
      await this.ensureDB();

      const query = this.db
        .select(
          'StoreID',
          'Name'
        )
        .from('Store')
        .where({StatusID: 1});

      const response = await query;

      return response as {StoreID: string, Name: string}[];
    } catch (error) {
      console.error('getStoresActive error: ', error);
      throw error;
    }
  }

  closeConnection(): void {
    if (this.db) {
      this.db.destroy();
    }
  }
}
