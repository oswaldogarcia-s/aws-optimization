import { RdsAdmin } from "../data-sources";

export default class DisableClubModelorama{
  private db: RdsAdmin;
  constructor(){
    this.db = new RdsAdmin();
  }

  async run(){
    try {
      console.log('DisableClubModelorama...');
      console.time('DisableClubModelorama');
      await this.db.disableClubModelorama();
      console.timeEnd('DisableClubModelorama');
    } catch (error) {
      console.error('Error in DisableClubModelorama: ', error);
      throw error;
    } finally {
      this.db.closeConnection();
    }
  }

  async rollback(){
    try {
      console.log('Rollback DisableClubModelorama...');
      console.time('Rollback DisableClubModelorama');
      await this.db.rollBackDisableClubModelorama();
      console.timeEnd('Rollback DisableClubModelorama');
    } catch (error) {
      console.error('Error in DisableClubModelorama rollback: ', error);
      throw error;
    } finally {
      this.db.closeConnection();
    }
  }
}