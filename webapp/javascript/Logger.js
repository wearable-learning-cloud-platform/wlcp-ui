
const LogLevel = {
    /**
     * Do not log anything
     * @public
     */
    NONE : -1,
    /**
     * Fatal level. Use this for logging unrecoverable situations
     * @public
     */
    FATAL : 0,
    /**
     * Error level. Use this for logging of erroneous but still recoverable situations
     * @public
     */
    ERROR : 1,
    /**
     * Warning level. Use this for logging unwanted but foreseen situations
     * @public
     */
    WARNING : 2,
    /**
     * Info level. Use this for logging information of purely informative nature
     * @public
     */
    INFO : 3,
    /**
     * Debug level. Use this for logging information necessary for debugging
     * @public
     */
    DEBUG : 4,
    /**
     * Trace level. Use this for tracing the program flow.
     * @public
     */
    TRACE : 5,
    /**
     * Trace level to log everything.
     * @public
     */
    ALL : (5 + 1)
};

var Logger = {
		
    loggingEnabled : true,
    defaultLogLevel : LogLevel.ERROR, //LogLevel.INFO,
    logger : null,

    init : function(logger) {
        this.logger = logger;
        if(this.loggingEnabled) { this.logger.setLevel(this.defaultLogLevel); }
    },

    info : function(infoMessage) {
        if(this.loggingEnabled) {
            this.logger.info(infoMessage);
        }
    },

    debug : function(debugMessage) {
        if(this.loggingEnabled) {
            this.logger.debug(debugMessage);
        }
    },

    warning : function(warningMessage) {
        if(this.loggingEnabled) {
            this.logger.warning(warningMessage);
        }
    },

    error : function(errorMessage) {
        if(this.loggingEnabled) {
            this.logger.error(errorMessage);
        }
    },

    fatal : function(fatalMessage) {
        if(this.loggingEnabled) {
            this.logger.fatal(fatalMessage);
        }
    },

    trace : function(traceMessage) {
        if(this.loggingEnabled) {
            this.logger.trace(traceMessage);
        }
    }

}