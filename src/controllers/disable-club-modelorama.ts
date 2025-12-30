import { RdsAdmin } from "../data-sources";

export default class DisableClubModelorama{
  private db: RdsAdmin;
  constructor(){
    this.db = new RdsAdmin();
  }

  async run(){
    try {
      await this.db.disableClubModelorama();
    } catch (error) {
      console.error('Error in DisableClubModelorama: ', error);
      throw error;
    }
  }
}