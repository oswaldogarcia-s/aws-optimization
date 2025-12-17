"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("../../controllers");
async function listUsers() {
    const cognito = new controllers_1.CognitoAdmin();
    await cognito.enableUsers();
}
listUsers();
