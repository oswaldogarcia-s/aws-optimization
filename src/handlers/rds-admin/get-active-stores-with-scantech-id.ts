import { GetScanntechData } from "../../controllers";


async function run() {
  const remove = new GetScanntechData();
  await remove.run();
}

run();