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
let eurekaClient = null;

function registerWithEureka(appName, ipAddr, portNumber, hostName, eurekaHost, eurekaPort) {

    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    eurekaClient = new Eureka({
        instance: {
            app: appName,
            hostName: hostName,
            ipAddr: ipAddr,
            vipAddress: appName,
            statusPageUrl : 'http://' + ipAddr + ':' + portNumber,
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
    if(options.configuration.ipAddress === undefined) { options.configuration.ipAddress =  process.env.ECS_INSTANCE_IP_ADDRESS }
    if(options.configuration.hostName === undefined) { options.configuration.hostName = process.env.HOSTNAME }
    if(options.configuration.eurekaHost === undefined) { options.configuration.hostName = process.env.EUREKA_DEFAULT_ZONE }
    registerWithEureka(options.configuration.appName, options.configuration.ipAddress, options.configuration.port, options.configuration.hostName, options.configuration.eurekaHost, options.configuration.eurekaPort);
    return function (req, res, next) {
        next();
        return;
    }
};