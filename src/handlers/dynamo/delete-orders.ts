import { CleanProcess } from "../../controllers";

async function listUsers(){
  const table = new CleanProcess();
  await await table.deleteOrders();
}

listUsers();