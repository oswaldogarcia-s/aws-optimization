import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { Parser } from 'json2csv';
import { CognitoClient } from "../data-sources";


export default class CognitoAdmin {
  private cognitoClient: CognitoClient;

  constructor() {
    this.cognitoClient = new CognitoClient();
  }

  private async getUserList(): Promise<string[]> {
    try {
      const csvPath = path.join(__dirname, "../../config/users.csv");

      const users: string[] = await new Promise((resolve, reject) => {
        const results: string[] = [];
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => {
            if (row.username) {
              results.push(row.username.trim());
            }
          })
          .on("end", () => resolve(results))
          .on("error", reject);
      });

      console.log(`📄 CSV leído, ${users.length} usuarios encontrados`);

      return users;
    } catch (error) {
      console.error('Error to list users: ', error);
      throw error;
    }
  }

  private mappingResponse(cognitoUsers: any[]) {
    return cognitoUsers.map((user) => ({
      UserStatus: user.UserStatus,
      Username: user.Username,
      Enabled: user.Enabled,
      UserCreateDate: user.UserCreateDate,
      UserLastModifiedDate: user.UserLastModifiedDate
    }));
  }

  async listUsers() {
    try {
      const users = await this.getUserList();

      const cognitoUsers = await this.cognitoClient.getUsers(users);

      const mapping =  this.mappingResponse(cognitoUsers);

      this.jsonToCsvConsole(mapping);
    } catch (error) {
      console.error('Error to list users: ', error);
      throw error;
    }
  }

  async disabledUsers() {
    try {
      const users = await this.getUserList();

      const cognitoUsers = await this.cognitoClient.getUsers(users);

      const usersToDisable = cognitoUsers.filter((user) => user.UserStatus === 'CONFIRMED').map((user) => user.Username);

      console.log('usersToDisable: ', usersToDisable);

      await this.cognitoClient.disabledUsers(usersToDisable);

      const cognitoUsersFinal = await this.cognitoClient.getUsers(users);

      console.log('cognitoUsersFinal: ', this.mappingResponse(cognitoUsersFinal));
    } catch (error) {
      console.error('Error to disable users: ', error);
      throw error;
    }
  }

  async enableUsers() {
    try {
      const users = await this.getUserList();

      const cognitoUsers = await this.cognitoClient.getUsers(users);

      console.log('cognitoUsers: ', this.mappingResponse(cognitoUsers));

      const usersToEnable = cognitoUsers.map((user) => user.Username);

      console.log('usersToEnable: ', usersToEnable);

      await this.cognitoClient.enableUsers(usersToEnable);

      const cognitoUsersFinal = await this.cognitoClient.getUsers(users);

      console.log('cognitoUsersFinal: ', this.mappingResponse(cognitoUsersFinal));
    } catch (error) {
      console.error('Error to enable users: ', error);
      throw error;
    }
  }

  jsonToCsvConsole<T>(data: T[]): void {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      console.log(csv);
    } catch (error) {
      console.error('Error al convertir JSON a CSV:', error);
    }
  }

}