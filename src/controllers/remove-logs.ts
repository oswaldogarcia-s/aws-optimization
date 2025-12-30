import { Git } from "../data-sources";
import { addOffConsoleOnProd, SnykScanner, YamlLoader } from "../services";

export default class RemoveLogs {
  errorRepo: string[] = [];

  async init() {
    await this.proccessRepoLists();
    console.log('Error repos: ', this.errorRepo);
  }

  async proccessRepoLists() {
    const repolists = [
     'hop-admin-api-product-repl',
     'hop-instore-api-data-scanntech'
    ]

    for(const repo of repolists){
      await this.processRepo(repo);
    }
  }

  async processRepo(repoName: string) {
    try {
      const basePath = '/Users/luisoswaldogarciaochoa/removeLogs/';
      const git = new Git(
        repoName,
        basePath,
        'feat/remove-logs',
        '[FEAT] remove logs'
      )
      await git.cloneRepo();

      await git.createBranch();

      const yaml = new YamlLoader(basePath + repoName + '/serverless.yml');
      yaml.load();
      const functions = yaml.getNode<{ [key: string]: { handler: string } }[]>('functions');
      
      const handlerSet = new Set<string>();

      functions.forEach((func) => {   
        Object.keys(func).map(key => func[key].handler)
          .forEach((str) => {
            console.log('str: ', str);
            const lastDotIndex = str.lastIndexOf('.');
            const handler = lastDotIndex !== -1 ? str.slice(0, lastDotIndex) : str;
            handlerSet.add(handler);
          });
      });

      const uniqueHandlers = Array.from(handlerSet);

      for (const handler of uniqueHandlers) {
        await this.editHandler(basePath + repoName + '/' + handler + '.ts');
      }

      const snyk = new SnykScanner(basePath + repoName);

      await snyk.runTest();

      await snyk.updateLibs();
      
      await snyk.applyOverrides();

      await snyk.resetDependencies();


      await git.commit();
      await git.publish();
    } catch (error) {
      console.error(`Error processing ${repoName}:`, error);
      this.errorRepo.push(repoName);
    }
  }

  async editHandler(path) {
    try {
      addOffConsoleOnProd(path);
    } catch (error) {
      throw error;
    }
  }
}