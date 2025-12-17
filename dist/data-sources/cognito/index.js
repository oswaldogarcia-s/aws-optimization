"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const credential_provider_sso_1 = require("@aws-sdk/credential-provider-sso");
class CognitoClient {
    constructor() {
        if (!process.env.AWS_REGION) {
            throw new Error('AWS_REGION no está definido en las variables de entorno');
        }
        if (!process.env.AWS_PROFILE) {
            throw new Error('AWS_PROFILE no está definido en las variables de entorno');
        }
        if (!process.env.AWS_PROFILE_TYPE) {
            throw new Error('AWS_PROFILE_TYPE no está definido en las variables de entorno');
        }
        const profileType = process.env.AWS_PROFILE_TYPE;
        const profile = process.env.AWS_PROFILE;
        this.client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: profileType === 'ini' ? (0, credential_provider_ini_1.fromIni)({ profile }) : (0, credential_provider_sso_1.fromSSO)({ profile })
        });
        if (!process.env.USER_POOL_ID) {
            throw new Error('USER_POOL_ID no está definido en las variables de entorno');
        }
        this.userPoolID = process.env.USER_POOL_ID;
    }
    async getUsers(filterValues, attributeName = 'username') {
        try {
            let results = [];
            for (const val of filterValues) {
                const command = new client_cognito_identity_provider_1.ListUsersCommand({
                    UserPoolId: this.userPoolID,
                    Filter: `${attributeName} = "${val}"`,
                    Limit: 60
                });
                const response = await this.client.send(command);
                results = results.concat(response.Users || []);
            }
            return results;
        }
        catch (error) {
            console.error('Error to get users: ', error);
            throw error;
        }
    }
    async disabledUsers(users) {
        try {
            for (const user of users) {
                const command = new client_cognito_identity_provider_1.AdminDisableUserCommand({
                    UserPoolId: this.userPoolID,
                    Username: user
                });
                await this.client.send(command);
            }
        }
        catch (error) {
            console.error('Error to disable users: ', error);
            throw error;
        }
    }
    async enableUsers(users) {
        try {
            for (const user of users) {
                const command = new client_cognito_identity_provider_1.AdminEnableUserCommand({
                    UserPoolId: this.userPoolID,
                    Username: user
                });
                await this.client.send(command);
            }
        }
        catch (error) {
            console.error('Error to enable users: ', error);
            throw error;
        }
    }
}
exports.default = CognitoClient;
