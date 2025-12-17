import { CognitoAdmin } from "../../controllers";

async function listUsers() {
  const cognito = new CognitoAdmin();
  await cognito.listUsers();
}

listUsers();