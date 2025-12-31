import { DisableClubModelorama } from "../../controllers";


async function removeLogs() {
  const remove = new DisableClubModelorama();
  await remove.rollback();
}

removeLogs();