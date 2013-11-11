var config =  {
  port: 8000,
  buildPath: "./build"
}

require('./main').run(config.port, config.buildPath);