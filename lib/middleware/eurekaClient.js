/**
 * Custom UI5 Server middleware example
 *
 * @param {Object} parameters Parameters
 * @param {Object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {Object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration if given in ui5.yaml
 * @returns {function} Middleware function to use
 */

const Eureka = require("eureka-js-client").Eureka;
const eurekaHost = (process.env.EUREKA_CLIENT_SERVICEURL_DEFAULTZONE || '127.0.0.1');
const eurekaPort = 8761;
const hostName = (process.env.HOSTNAME || 'localhost')
const ipAddr = '172.0.0.1';
let eurekaClient = null;

function registerWithEureka(appName, ipAddr, portNumber, hostName) {

    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    eurekaClient = new Eureka({
        instance: {
            app: appName,
            hostName: hostName,
            ipAddr: ipAddr,
            vipAddress: appName,
            statusPageUrl : 'http://localhost:3000',
            instanceId : hostName + ':' + appName + ':' + portNumber,
            port: {
              '$': portNumber,
              '@enabled': 'true',
            },
            dataCenterInfo: {
              '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
              name: 'MyOwn',
            },
        },
        //retry 10 time for 3 minute 20 seconds.
        eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka/apps/',
        maxRetries: 10,
        requestRetryDelay: 2000,
        },
    })

    eurekaClient.logger.level('debug')

    eurekaClient.on('deregistered', () => {
        process.exit();
        console.log('after deregistered');
    })
    
    eurekaClient.on('started', () => {
      console.log("eureka host  " + eurekaHost);
    })

    eurekaClient.start( error => {
        console.log(error || "user service registered")
    });
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) {
        eurekaClient.stop();
    }
}

module.exports = function({resources, options}) {
    registerWithEureka("wlcp-ui", "127.0.0.1", 3000, "docker-host");
    return function (req, res, next) {
        next();
        return;
    }
};