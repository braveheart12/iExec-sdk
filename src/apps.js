const Debug = require('debug');
const path = require('path');
const ora = require('ora');
const createXWHEPClient = require('xwhep-js-client');
const account = require('./account');
const utils = require('./utils');

const debug = Debug('iexec:apps');
const xwhep = createXWHEPClient({ hostname: 'xw.iex.ec', port: '443' });

const send = async (chainName, cliAppName) => {
  const spinner = ora();
  try {
    debug('cliAppName', cliAppName);
    const chainID = utils.truffleConfig.networks[chainName].network_id;
    const appName = cliAppName || utils.iexecConfig.appName;
    debug('appName', appName);
    const { jwtoken } = await account.load();
    debug('jwtoken', jwtoken);
    const appPath = path.join(process.cwd(), 'apps', appName);
    debug('appPath', appPath);

    spinner.start('sending app to iExec server...');

    const { networks } = await utils.loadContractDesc();

    if (!(chainID in networks) || !networks[chainID].address) throw new Error(`Missing dapp address for ${chainName}. Need to "iexec migrate" before sending app`);

    const contractAddress = networks[chainID].address;
    debug('contractAddress', contractAddress);
    const cookies = await xwhep.auth(jwtoken);
    const res = await xwhep.registerApp(
      cookies,
      '',
      '',
      '',
      contractAddress,
      'linux',
      'amd64',
      'file://'.concat(appPath),
    );
    debug('res', res);

    spinner.succeed(`App successfully sent for ${chainName} dapp: ${contractAddress}\n`);
  } catch (error) {
    spinner.fail(`send() failed with ${error}`);
    throw error;
  }
};

module.exports = {
  send,
};