function getCredentials(argCreds) {
        // Is there a filename in args?

  var credsFile = argCreds

        // no? Use the first file that exists:
        //    * ./tumblr-credentials.json
        //    * ./credentials.json
        //    * ~/tumblr-credentials.json

    || _.find(['tumblr-credentials.json',
            'credentials.json',
            path.join(osHomedir(), 'tumblr-credentials.json')
           ],
           credsFile => fs.existsSync(credsFile))

        // still no match? Use credentials.json

    || 'credentials.json';

  //  try reading & parsing the file
  try {
    var credentials = JSON5.parse(fs.readFileSync(credsFile).toString());
  } catch (e) {
    console.error(chalk.red('Error loading credentials!'));
    console.error('Make sure %s exists or specify %s', chalk.cyan(credsFile || 'credentials.json'), chalk.cyan('--credentials=path/to/credentials.json'));
    process.exit();
  }

      //  do we have all the properties we need?
      //  get the missingCredentials

  var missingCredentials =
      _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'],
               cred => !credentials.hasOwnProperty(cred))

  if (!_.isEmpty(missingCredentials)) {
    console.warn(chalk.yellow('Credentials is missing keys:'));
    missingCredentials.forEach(key => console.warn(chalk.yellow('  * %s'), key));

    if (credentials.consumer_key && credentials.consumer_secret) {
      console.log('\nYou can generate user tokens by going to the API console:\n');
      console.log(chalk.magenta([ 'https://api.tumblr.com/console/auth',
                                  '?consumer_key=', credentials.consumer_key,
                                  '&consumer_secret=', credentials.consumer_secret
                                ].join('')));
    }
  }

  return credentials;
}

