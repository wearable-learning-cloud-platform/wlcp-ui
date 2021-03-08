var Logger = {
		
    loggingEnabled : false,
    defaultLogLevel : 6,
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