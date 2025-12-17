import { CognitoAdmin } from "../../controllers";

async function listUsers(){
  const cognito = new CognitoAdmin();
  await cognito.enableUsers();
}

listUsers();