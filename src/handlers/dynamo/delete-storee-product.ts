import { CleanProcess } from "../../controllers";

async function process(){
  const table = new CleanProcess();
  await await table.deleteStoreProduct();
}

process();