"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const data_sources_1 = require("../data-sources");
class CognitoAdmin {
    constructor() {
        this.cognitoClient = new data_sources_1.CognitoClient();
    }
    async getUserList() {
        try {
            const csvPath = path_1.default.join(__dirname, "../../config/users.csv");
            const users = await new Promise((resolve, reject) => {
                const results = [];
                fs_1.default.createReadStream(csvPath)
                    .pipe((0, csv_parser_1.default)())
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
        }
        catch (error) {
            console.error('Error to list users: ', error);
            throw error;
        }
    }
    mappingResponse(cognitoUsers) {
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
            console.log('cognitoUsers: ', this.mappingResponse(cognitoUsers));
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Error to enable users: ', error);
            throw error;
        }
    }
}
exports.default = CognitoAdmin;
