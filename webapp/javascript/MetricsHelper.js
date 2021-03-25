var MetricsHelper = {
		
    loggingEnabled : true,
    
    LogEventType : {
		BUTTON_PRESS : "BUTTON_PRESS",
		STATE : "STATE",
		CONNECTION : "CONNECTION",
		TRANSITION : "TRANSITION"
	},
	
	LogContext : {
		GAME_MANAGER : "GAME_MANAGER",
		GAME_EDITOR : "GAME_EDITOR",
		GAME_PLAYER : "GAME_PLAYER"
	},
		
	saveLogEvent : function(saveJSON, logSuccess = this.logSuccess, logError = this.logError) {
		
		if(this.loggingEnabled) {
			
			RestAPIHelper.postAbsolute("/wlcp-metrics/logEventController/saveLogEvent", saveJSON, true, logSuccess, logError, this, false);

		}
	},

	logSuccess : function(data) {

	},

	logError : function(error) {

	},

	createBasicPayload : function() {
		var payload = {
			"logEventType" : null,
			"logContext" : null,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : null,
			"gameInstanceId" : null,
			"timeStamp" : Date.now()
		};
		return payload;
    },
    
	createBasicPayload : function(logEventType, logContext) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : null,
			"gameInstanceId" : null,
			"timeStamp" : Date.now()
		};
		return payload;
	},

	createBasicPayload : function(logEventType, logContext, gameId) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now()
		};
		return payload;
	},


	/**
	 * Payload for STATE events
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} stateEvent 
	 */
	createStatePayload : function(logEventType, logContext, gameId, stateEvent) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"stateEvent" : stateEvent
		};
		return payload;
	},


	/**
	 * Payload for STATE events with state properties
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} componentProperties 
	 * @param {*} stateEvent 
	 * @returns 
	 */
	createStatePayloadFull : function(logEventType, logContext, gameId, stateId, componentProperties, stateEvent) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"stateId" : stateId,
			"componentProperties" : componentProperties,
			"stateEvent" : stateEvent
		};
		return payload;
	},


	/**
	 * Payload for CONNECTION events
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} connectionEvent 
	 */
	createConnectionPayload : function(logEventType, logContext, gameId, connectionEvent) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"connectionEvent" : connectionEvent
		};
		return payload;
	},


	/**
	 * Payload for CONNECTION events with connection properties
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} connectionEvent 
	 */
	 createConnectionPayloadFull : function(
		 logEventType, 
		 logContext, 
		 gameId, 
		 connectionId, 
		 connectionFrom, 
		 connectionTo, 
		 connectionEvent
	) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"connectionId" : connectionId, 
			"connectionFrom" : connectionFrom, 
			"connectionTo" : connectionTo, 
			"connectionEvent" : connectionEvent
		};
		return payload;
	},


	/**
	 * Payload for TRANSITION events
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} transitionEvent 
	 */
	createTransitionPayload : function(logEventType, logContext, gameId, transitionEvent) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"transitionEvent" : transitionEvent
		};
		return payload;
	},


	/**
	 * Payload for TRANSITION events with transition properties
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} transitionEvent 
	 */
	 createTransitionPayloadFull : function(
		 logEventType, 
		 logContext, 
		 gameId, 
		 transitionId, 
		 transitionProperties, 
		 transitionEvent
	) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(), 
			"transitionId" : transitionId,
			"transitionProperties" : transitionProperties,
			"transitionEvent" : transitionEvent
		};
		return payload;
	},


	/**
	 * Payload for BUTTON_PRESS events
	 * @param {*} logEventType 
	 * @param {*} logContext 
	 * @param {*} gameId 
	 * @param {*} buttonPressed 
	 */
	createButtonPayload : function(logEventType, logContext, gameId, buttonPressed) {
		var payload = {
			"logEventType" : logEventType,
			"logContext" : logContext,
			"usernameId" : sap.ui.getCore().getModel("user").oData.username,
			"gameId" : gameId,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(),
			"buttonPressed" : buttonPressed
		};
		return payload;
	}

}