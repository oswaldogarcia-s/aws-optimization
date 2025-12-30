import { RemoveLogs } from "../../controllers";

async function removeLogs() {
  const remove = new RemoveLogs();
  await remove.init();
}

removeLogs();