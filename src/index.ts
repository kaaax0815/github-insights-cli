#!/usr/bin/env node
import { Command, program } from 'commander';

import Runner from './Runner';

program.description('CLI for github-insights');

program
  .command('repos')
  .description('Get all Repos')
  .requiredOption('-u, --user <user>', 'user')
  .option('-s, --sort [size|stars|forks]', 'sort type', 'size')
  .option('-d, --direction [asc|desc]', 'direction of sort', 'desc')
  .action(async (args, program: Command) => {
    const runner = new Runner(args, program);
    runner.getRepos();
  });
program
  .command('traffic')
  .description('Get Traffic about Repo')
  .requiredOption('-u, --user <user>', 'user')
  .requiredOption('-r, --repo <repo>', 'repo')
  .requiredOption('-U, --username <username>', 'Username')
  .requiredOption('-P, --password <key>', 'Auth Key')
  .action(async (args, program: Command) => {
    const runner = new Runner(args, program);
    runner.getTraffic();
  });
program
  .command('overview')
  .description('Get Overview about User')
  .requiredOption('-u, --user <user>', 'user')
  .requiredOption('-U, --username <username>', 'Username')
  .requiredOption('-P, --password <key>', 'Auth Key')
  .action(async (args, program: Command) => {
    const runner = new Runner(args, program);
    runner.getOverview();
  });

program.parse(process.argv);
