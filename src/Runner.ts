import clear from 'clear';
import { Command } from 'commander';
import { sort } from 'fast-sort';
import * as insights from 'github-insights';
import ora from 'ora';

class Runner {
  spinner: ora.Ora | undefined;
  args: ReposArgs;
  program: Command;
  constructor(args: ReposArgs, program: Command) {
    this.args = args || [];
    this.program = program || [];
  }

  async getRepos() {
    const { user, sort, direction } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');
      let Repos;
      switch (sort) {
        case 'size':
          switch (direction) {
            case 'asc':
              Repos = (await insights.repos(user)).sort((a, b) => a.size - b.size);
              break;
            case 'desc':
              Repos = (await insights.repos(user)).sort((a, b) => b.size - a.size);
              break;
            default:
              throw new Error('Invalid direction');
          }
          break;
        case 'stars':
          switch (direction) {
            case 'asc':
              Repos = (await insights.repos(user)).sort(
                (a, b) => a.stargazers_count - b.stargazers_count
              );
              break;
            case 'desc':
              Repos = (await insights.repos(user)).sort(
                (a, b) => b.stargazers_count - a.stargazers_count
              );
              break;
            default:
              throw new Error('Invalid direction');
          }
          break;
        case 'forks':
          switch (direction) {
            case 'asc':
              Repos = (await insights.repos(user)).sort((a, b) => a.forks_count - b.forks_count);
              break;
            case 'desc':
              Repos = (await insights.repos(user)).sort((a, b) => b.forks_count - a.forks_count);
              break;
            default:
              throw new Error('Invalid direction');
          }
          break;
        default:
          throw new Error('Invalid sort type');
      }
      spinner.succeed('Success');
      console.log(Repos);
      return Repos;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getClones() {
    const { user, repo, username, password } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');
      const clones = await insights.traffic.clones(user, repo, username, password);
      spinner.succeed('Success');
      return clones;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getViews() {
    const { user, repo, username, password } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');
      const views = await insights.traffic.views(user, repo, username, password);
      spinner.succeed('Success');
      return views;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getPaths() {
    const { user, repo, username, password } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');
      const paths = await insights.traffic.popularPaths(user, repo, username, password);
      spinner.succeed('Success');
      return paths;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getReferrers() {
    const { user, repo, username, password } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');
      const referrers = await insights.traffic.popularReferrers(user, repo, username, password);
      spinner.succeed('Success');
      return referrers;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getTraffic() {
    const { user, repo } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      const clones = await this.getClones();
      const views = await this.getViews();
      const paths = (await this.getPaths())?.map((value) => value.title);
      const referrers = (await this.getReferrers())?.map((value) => value.referrer);
      const analytics = {
        clones: clones ? clones.uniques : undefined,
        views: views ? views.uniques : undefined,
        paths: paths ? paths : undefined,
        referrers: referrers ? referrers : undefined
      };
      clear();
      console.log(`--- Statistics about ${user}/${repo} ---`);
      console.log(analytics);
      return analytics;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
  async getOverview() {
    const { user, username, password } = this.args;

    const spinner = ora();
    this.spinner = spinner;

    try {
      spinner.start('Loading...');

      // Only Active Repos
      const repos = (await insights.repos(user)).filter((value) => value.archived != true);

      // Populate Maps: Map<<repo>, [<clones>,<views>,<size>]
      const RepoStats: Map<string, Stats> = new Map();
      for (const repo of repos) {
        RepoStats.set(repo.full_name, [
          (await insights.traffic.clones(repo.owner.login, repo.name, username, password)).uniques,
          (await insights.traffic.views(repo.owner.login, repo.name, username, password)).uniques,
          repo.size,
          repo.owner.login == user ? true : false
        ]);
      }

      // Sort by Clones and Views
      const sortedRepoStats = new Map(...[sort([...RepoStats]).desc([(u) => u[1][0]])]);

      // Get Repos/Clones/Views/Size
      let ownRepos = 0;
      let ownClones = 0;
      let ownViews = 0;
      let ownSize = 0;
      let notOwnRepos = 0;
      let notOwnClones = 0;
      let notOwnViews = 0;
      let notOwnSize = 0;
      sortedRepoStats.forEach((element) => {
        element[3] ? ownRepos++ : notOwnRepos++;
        element[3] ? (ownClones += element[0]) : (notOwnClones += element[0]);
        element[3] ? (ownViews += element[1]) : (notOwnViews += element[1]);
        element[3] ? (ownSize += element[2]) : (notOwnSize += element[2]);
      });
      const RepoStatsArray = [...sortedRepoStats];
      const RepoStatsTable = RepoStatsArray.map((value) => ({
        Repo: value[0],
        Clones: value[1][0],
        Views: value[1][1],
        Size: value[1][2]
      }));
      const SortedStatsTable = sort(RepoStatsTable).desc([(u) => u.Clones, (u) => u.Views]);

      // No Heavy Computing or Network Requests After
      spinner.succeed('Success');
      console.log(`--- All Repos ---`);
      console.table(SortedStatsTable);
      console.log(`--- Statistics about ${user} ---`);
      console.log('[All/Own]');
      console.log(`Repos: ${ownRepos + notOwnRepos}/${ownRepos}`);
      console.log(`Clones: ${ownClones + notOwnClones}/${ownClones}`);
      console.log(`Views: ${ownViews + notOwnViews}/${ownViews}`);
      console.log(
        `Size: ${formatBytes((ownSize + notOwnSize) * 1000)}/${formatBytes(ownSize * 1000)}`
      );
      return undefined;
    } catch (err) {
      if (err.message) {
        spinner.fail(` ${err.message}`);
        return undefined;
      }
      spinner.fail(' error: see below for more details');
      console.log(err);
      return undefined;
    }
  }
}

//  https://stackoverflow.com/q/15900485/
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default Runner;

export interface ReposArgs {
  user: string;
  repo: string;
  username: string;
  password: string;
  sort: 'size' | 'stars' | 'forks';
  direction: 'asc' | 'desc';
}

export interface Stats {
  /** Clones */
  0: number;
  /** Views */
  1: number;
  /** Size */
  2: number;
  /** Owner */
  3: boolean;
}
