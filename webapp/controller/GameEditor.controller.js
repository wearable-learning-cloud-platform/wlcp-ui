sap.ui.controller("org.wlcp.wlcp-ui.controller.GameEditor", {

	oModel : null,

	newGameModel : {
		gameId : "",
		teamCount : 3,
		playersPerTeam : 3,
		stateIdCount : 0,
		transitionIdCount : 0,
		connectionIdCount : 0,
		username : {
			usernameId : sap.ui.getCore().getModel("user").oData.username
		},
		visibility : true,
		dataLog : false
	},
	
	gameModel : {
		gameId : "",
		teamCount : 0,
		playersPerTeam : 0,
		stateIdCount : 0,
		transitionIdCount : 0,
		connectionIdCount : 0,
		username : {
			usernameId : ""
		},
		visibility : true,
		dataLog : false
	},
	
	stateList : [],
	transitionList : [],
	connectionList : [],
	
	jsPlumbInstance : null,
	
	loadFromEditor : null,

	scroller : new GameEditorScroller(),
	
	initJsPlumb : function() {
		this.jsPlumbInstance = jsPlumb.getInstance();
		this.jsPlumbInstance.importDefaults({Connector: ["Flowchart", {cornerRadius : 50}], ConnectionOverlays: [
            [ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8,
                paintStyle:{ fill: "#000000" }
            }]
        ]});
		this.jsPlumbInstance.bind("beforeDrop", $.proxy(this.connectionDropped, this));
		this.jsPlumbInstance.bind("beforeDetach", $.proxy(this.connectionDetached, this));
	},
	
	initStartState : function() {
		
		//Create a new start state
		var startState = new StartState("startStateTopColor", "startStateBottomColor", sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.startState") , md5(this.gameModel.gameId) + "_start", this.jsPlumbInstance);
		
		//Set the position
		startState.setPositionX(((document.getElementById("container-wlcp-ui---gameEditor--pad").offsetWidth / 2) - (150 / 2))); startState.setPositionY(100);
		
		//Redraw it
		startState.draw();
		
		//Push back the state
		this.stateList.push(startState);
		
		//Save it
		this.saveGame();
	},
	
	initToolboxText : function() {
		$("#container-wlcp-ui---gameEditor--toolboxTitle")[0].innerHTML = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.toolboxTitle");
		$("#container-wlcp-ui---gameEditor--toolboxOutputState")[0].children[0].children[0].innerHTML = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState");
		$("#container-wlcp-ui---gameEditor--toolboxTransition")[0].children[0].children[0].innerHTML = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition");
	},

	initToolbox : function() {
		$("#container-wlcp-ui---gameEditor--toolboxOutputState").draggable({ revert: false, helper: "clone", start : this.dragStart, stop : $.proxy(this.stateDragStop, this)});
		$("#container-wlcp-ui---gameEditor--toolboxTransition").draggable({ revert: false, helper: "clone", start : this.dragStart, stop : $.proxy(this.transitionDragStop, this)});
	},
	
	initToolbox2 : function() {
		$("#container-wlcp-ui---gameEditor--buttonPressTransition").draggable({ revert: false, helper: "clone", start : this.dragStart, stop : $.proxy(this.transitionDragStop, this)});
	},
	
	onItemSelect : function(oEvent) {
		setTimeout(function(t) {
			t.initToolbox2();
		}, 500, this);
	},	
	
	dragStart : function() {
		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-0").style.overflow = "visible";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-x"] = "visible";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-y"] = "visible";
	},
	
	stateDragStop : function(event, ui) {
		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-0").style.overflow = "auto";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-x"] = "hidden";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-y"] = "auto";
		
		if(State.absoluteToRelativeX(ui.position.left, 150) + GameEditor.getScrollLeftOffset() < 0 || 
			State.absoluteToRelativeY(ui.position.top) + GameEditor.getScrollTopOffset() < 0) {
			sap.m.MessageBox.error("A state could not be placed there!"); 
			return;
		}

		var outputState = new OutputState(
			"toolboxOutputStateTopColor", 
			"toolboxOutputStateBottomColor", 
			sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState"), 
			this.createStateId(), 
			this.jsPlumbInstance
		);

		outputState.setPositionX(
			State.absoluteToRelativeX(ui.position.left, 150) + GameEditor.getScrollLeftOffset()
		); 
		
		outputState.setPositionY(
			State.absoluteToRelativeY(ui.position.top) + GameEditor.getScrollTopOffset()
		);
		
		outputState.addPadSpace();
		outputState.draw();
		this.stateList.push(outputState);

		// Log STATE event: state-create
		// Create a new state in the canvas
		Logger.info("New state created");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId,
				outputState.htmlId, 
				JSON.stringify(outputState.modelJSON.iconTabs),
				"state-create"
			)
		);

	},
	
	transitionDragStop : function(event, ui) {

		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-0").style.overflow = "auto";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-x"] = "hidden";
		document.getElementById("container-wlcp-ui---gameEditor--toolbox").style["overflow-y"] = "auto";
		
		var connection = Transition.getClosestConnection(ui.position.left, ui.position.top, this.jsPlumbInstance);
		
		if(connection != null) {
			
			for(var i = 0; i < GameEditor.getEditorController().connectionList.length; i++) {
				if(GameEditor.getEditorController().connectionList[i].connectionId == connection.id) {
					connection = GameEditor.getEditorController().connectionList[i];
					break;
				}
			}
			
			if(connection.connectionFrom.stateType === "START_STATE") {
				sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.cannotPlaceTransitionAfterStartState"));
				return;
			}

			var inputTransition = new InputTransition("transition", connection, this.createTransitionId(), this);
			
			inputTransition.connection.transition = inputTransition;
			this.transitionList.push(inputTransition);
			
			for(var i = 0; i < this.connectionList.length; i++) {
				if(this.connectionList[i].connectionId == connection.id) {
					this.connectionList[i].transition = inputTransition;
					inputTransition.connection = this.connectionList[i];
					break;
				}
			}
			
			inputTransition.onChange(connection);
			
			for(var i = 0; i < this.stateList.length; i++) {
				if(this.stateList[i].htmlId == connection.connectionTo.htmlId) {
					this.stateList[i].onChange();
				}
			}

			// Log TRANSITION event: transition-create
			// Create a new transition in the canvas
			Logger.info("Transition: created");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					this.gameModel.gameId,
					inputTransition.overlayId, 
					JSON.stringify(inputTransition.modelJSON.iconTabs), 
					inputTransition.connection.connectionId, 
					"transition-create"
				)
			);

		} else {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.cannotPlaceTransition"));
		}
	},
	
	/**
	 * Called when the user attempts to create a connection
	 * @param {*} oEvent 
	 * @returns 
	 */
	connectionDropped : function(oEvent) {

		//Check to see if we are trying to drag a connection to an output endpoint
		if(oEvent.dropEndpoint.anchor.type === "Bottom") {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.cannotDragOutputToOutput"));
			return false;
		}

		//Check to see if the state has an input transition
		if(GameEditor.getJsPlumbInstance().getConnections({target : oEvent.sourceId}).length == 0 && !oEvent.sourceId.includes("start")) {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.outputWithoutInput"));
			return false;
		}

		//Check to see if the connection already exists
		//Or if they are trying to add a second of the same source and target
		//This can probably be moved to a validator eventually
		for(var i = 0; i < this.connectionList.length; i++) {
			if(oEvent.connection.id == this.connectionList[i].connectionId) {
				return false;
			} else if(oEvent.sourceId == this.connectionList[i].connectionFrom.htmlId && oEvent.targetId == this.connectionList[i].connectionTo.htmlId) {
				sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.duplicateConnection"));
				return false;
			}
		}
		
		//Else we need to create a new one
		var connection = new Connection( this.createConnectionId(), oEvent.sourceId, oEvent.targetId);
		this.connectionList.push(connection);
		connection.validate();

		// Retrieve the transition for this connection, if any
		let connectionTransition = connection.transition == null ? null : connection.transition.overlayId;

		// Log CONNECTION event: connection-create
		// Create a new connection between states on the canvas
		Logger.info("Connection created successfully");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createConnectionPayloadFull(
				MetricsHelper.LogEventType.CONNECTION, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId,
				connection.connectionId, 
				connection.connectionFrom.htmlId, 
				connection.connectionTo.htmlId, 
				connectionTransition, 
				"connection-create"
			)
		);

		return false;
	},
	
	/**
	 * Called when the user attempts to remove a connection
	 * @param {*} oEvent 
	 * @returns 
	 */
	connectionDetached : function(oEvent) {

		var i = 0;
		var that = this;
		
		if(oEvent.suspendedElementId == oEvent.targetId || typeof oEvent.suspendedElementId === "undefined") {

			for(var i = 0; i < this.connectionList.length; i++) {

				if(this.connectionList[i].connectionId == oEvent.id) {
					
					if(this.connectionList[i].connectionFrom.getActiveScopes().length > 0) {

						// Display confirmation dialog to user on attempt to remove a connection
						sap.m.MessageBox.confirm(
							sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validationEngine"), 
							{
								title:sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validation.title"), 
								onClose : function (oEvent2) {
							
									// CASE: User attempts to remove a connection -> confirmation box displayed -> user confirms "OK"
									if(oEvent2 == sap.m.MessageBox.Action.OK) {

										// Get the id of the connection to be removed before detaching
										let connectionIdToRemove = that.connectionList[i].connectionId;
										
										// Get the IDs of the states the connection is connected to before detaching
										let connectionFrom = that.connectionList[i].connectionFrom.htmlId;
										let connectionTo = that.connectionList[i].connectionTo.htmlId;

										// Retrieve the transition for this connection, if any
										let connectionTransition = that.connectionList[i].transition == null ? null : that.connectionList[i].transition.overlayId;
										
										that.connectionList[i].detach();
										
										GameEditor.getJsPlumbInstance().deleteConnection(
											GameEditor.getJsPlumbInstance().getConnections({source : connectionFrom, target : connectionTo})[0], 
											{fireEvent : false, force : true}
										);
										
										// Log CONNECTION event: connection-remove-confirm
										// Connection is removed after triggering then confirming the confirmation dialog
										Logger.info("Connection removal: confirmed")
										MetricsHelper.saveLogEvent(
											MetricsHelper.createConnectionPayloadFull(
												MetricsHelper.LogEventType.CONNECTION,
												MetricsHelper.LogContext.GAME_EDITOR,
												GameEditor.getEditorController().gameModel.gameId,
												connectionIdToRemove, 
												connectionFrom, 
												connectionTo, 
												connectionTransition, 
												"connection-remove-confirm"
											)
										);

									}
									// CASE: User attempts to remove a connection -> confirmation box displayed -> user cancels "Cancel"
									else if(oEvent2 == sap.m.MessageBox.Action.CANCEL) {

										// Get the id of the connection to be removed before detaching
										let connectionIdToRemove = that.connectionList[i].connectionId;
										
										// Get the IDs of the states the connection is connected to before detaching
										let connectionFrom = that.connectionList[i].connectionFrom.htmlId;
										let connectionTo = that.connectionList[i].connectionTo.htmlId;

										// Retrieve the transition for this connection, if any
										let connectionTransition = that.connectionList[i].transition == null ? null : that.connectionList[i].transition.overlayId;

										// Log CONNECTION event: connection-remove-cancel
										// Connection removal is canceled after triggering then canceling the confirmation dialog
										Logger.info("Connection removal: canceled")
										MetricsHelper.saveLogEvent(
											MetricsHelper.createConnectionPayloadFull(
												MetricsHelper.LogEventType.CONNECTION,
												MetricsHelper.LogContext.GAME_EDITOR,
												GameEditor.getEditorController().gameModel.gameId,
												connectionIdToRemove, 
												connectionFrom, 
												connectionTo, 
												connectionTransition, 
												"connection-remove-cancel"
											)
										);

									}
								}
							}
						);
						return false;
					} 
					else {

						// Get the id of the connection to be removed before detaching
						connectionIdToRemove = this.connectionList[i].connectionId;

						// Get the IDs of the states the connection is connected to before detaching
						connectionFromToRemove = this.connectionList[i].connectionFrom.htmlId;
						connectionToToRemove = this.connectionList[i].connectionTo.htmlId;

						// Retrieve the transition for this connection, if any
						let connectionTransition = this.connectionList[i].transition == null ? null : this.connectionList[i].transition.overlayId;

						this.connectionList[i].detach();

						// Log CONNECTION event: connection-remove-noconfirm
						// Connection is removed without triggering the confirmation dialog
						Logger.info("Connection removal: no confirmation")
						MetricsHelper.saveLogEvent(
							MetricsHelper.createConnectionPayloadFull(
								MetricsHelper.LogEventType.CONNECTION,
								MetricsHelper.LogContext.GAME_EDITOR,
								this.gameModel.gameId,
								connectionIdToRemove, 
								connectionFromToRemove, 
								connectionToToRemove, 
								connectionTransition, 
								"connection-remove-noconfirm"
							)
						);

						return true;
					}
				}
			}
		} else {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.cannotDropConnection"));
		}
	},

	createStateId : function() {
		this.gameModel.stateIdCount++;
		return md5(this.gameModel.gameId) + "_state_" + this.gameModel.stateIdCount;
	},
	
	createTransitionId : function() {
		this.gameModel.transitionIdCount++;
		return md5(this.gameModel.gameId) + "_transition_" + this.gameModel.transitionIdCount;
	},
	
	createConnectionId : function() {
		this.gameModel.connectionIdCount++;
		return md5(this.gameModel.gameId) + "_connection_" + this.gameModel.connectionIdCount;
	},
		
	/**
	 * Called when the New game editor button is pressed
	 */
	newGame : function(oEvent) {
		var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.CreateGame", sap.ui.controller("org.wlcp.wlcp-ui.controller.CreateLoadGame"));
		fragment.setModel(new sap.ui.model.json.JSONModel(this.newGameModel));
		fragment.open();
		
		// Log BUTTON_PRESS event: button-new-game
		// New game button is pressed
		Logger.info("Game Editor window: New button pressed")
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-new-game"
			)
		); 
	},
	
	initNewGame : function() {
		
		//Init jsPlumb
		this.initJsPlumb();
		  
		//Init the start state
		this.initStartState();
		  
		//Setup the toolbox drag and drop
		this.initToolbox();

		//Set the game name
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--padPage").setTitle(this.gameModel.gameId);
	},
	
	/**
	 * Called when the Load game editor button is pressed
	 */
	loadGame : function() {

		var loadGameDialogModel = {
			privateGames : null,
			publicGames : null
		};

		RestAPIHelper.get(
			"/gameController/getPrivateGames?usernameId=" + sap.ui.getCore().getModel("user").oData.username, 
			false,
			
			function(data) {
				loadGameDialogModel.privateGames = data;

				RestAPIHelper.get(
					"/gameController/getPublicGames", 
					false,

					function(data) {
						loadGameDialogModel.publicGames = data;
						
						var fragment = sap.ui.xmlfragment(
							"org.wlcp.wlcp-ui.fragment.GameEditor.LoadGame", 
							sap.ui.controller("org.wlcp.wlcp-ui.controller.CreateLoadGame")
						);
						
						fragment.setModel(new sap.ui.model.json.JSONModel(loadGameDialogModel));
						fragment.open();
					}, 

					function(error) {
						//Allow default error handling
					}, this
				);
			}, 
			
			function(error) {
				//Allow default error handling
			}, this
		);

		// Log BUTTON_PRESS event: button-load-game
		// Load button is pressed
		Logger.info("Load button pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-load-game"
			)
		);
	},
	
	load : function() {
		RestAPIHelper.get(
			"/gameController/loadGame?gameId=" + encodeURIComponent(this.gameModel.gameId), 
			true, this.loadSuccess, this.loadError, this
		);
	},
	
	loadSuccess(loadedData) {

		//Open the busy dialog
		this.busy = new sap.m.BusyDialog();
		this.busy.open();

		this.gameModel.gameId = loadedData.gameId;
		this.gameModel.teamCount = loadedData.teamCount;
		this.gameModel.playersPerTeam = loadedData.playersPerTeam;
		this.gameModel.visibility = loadedData.visibility;
		this.gameModel.stateIdCount = loadedData.stateIdCount;
		this.gameModel.transitionIdCount = loadedData.transitionIdCount;
		this.gameModel.connectionIdCount = loadedData.connectionIdCount;
		this.gameModel.username.usernameId = loadedData.username.usernameId;

		//Set the game name
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--padPage").setTitle(this.gameModel.gameId);
		
		//Init jsPlumb
		this.initJsPlumb();
		
		//Setup the toolbox drag and drop
		this.initToolbox();
		
		//Load the states
		for(var i = 0; i < loadedData.states.length; i++) {
			switch(loadedData.states[i].stateType) {
			case "START_STATE":
				StartState.load(loadedData.states[i]);
				break;
			case "OUTPUT_STATE":
				OutputState.load(loadedData.states[i]);
				break;
			}
		}
		
		//Load the connections
		Connection.load(loadedData.connections);
		
		//Load the transitions
		for(var i = 0; i < loadedData.transitions.length; i++) {
			InputTransition.load(loadedData.transitions[i]);
		}
		
		//Load state connections
		for(var i = 0; i < loadedData.states.length; i++) {
			for(var n = 0; n < this.stateList.length; n++) {
				if(loadedData.states[i].stateId == this.stateList[n].htmlId) {
					for(var j = 0; j < loadedData.states[i].inputConnections.length; j++) {
						for(var l = 0; l < this.connectionList.length; l++) {
							if(loadedData.states[i].inputConnections[j] == this.connectionList[l].connectionId) {
								this.stateList[n].inputConnections.push(this.connectionList[l]);
								this.connectionList[l].connectionTo = this.stateList[n];
							}
						}
					}
					for(var j = 0; j < loadedData.states[i].outputConnections.length; j++) {
						for(var l = 0; l < this.connectionList.length; l++) {
							if(loadedData.states[i].outputConnections[j] == this.connectionList[l].connectionId) {
								this.stateList[n].outputConnections.push(this.connectionList[l]);
								this.connectionList[l].connectionFrom = this.stateList[n];
							}
						}
					}
				}
			}
		}
		
		//Load connection transition
		for(var i = 0; i < loadedData.connections.length; i++) {
			if(loadedData.connections[i].transition != null) {
				for(var n = 0; n < this.connectionList.length; n++) {
					if(this.connectionList[n].connectionId == loadedData.connections[i].connectionId) {
						for(var j = 0; j < this.transitionList.length; j++) {
							if(this.transitionList[j].overlayId == loadedData.connections[i].transition) {
								this.connectionList[n].transition = this.transitionList[j];
							}
						}
					}
				}
			}
		}
		
		//Load transition connection
		for(var i = 0; i < loadedData.transitions.length; i++) {
			if(loadedData.transitions[i].connection != null) {
				for(var n = 0; n < this.transitionList.length; n++) {
					if(this.transitionList[n].overlayId == loadedData.transitions[n].transitionId) {
						for(var j = 0; j < this.connectionList.length; j++) {
							if(this.connectionList[j].connectionId == loadedData.transitions[n].connection) {
								this.transitionList[n].connection = this.connectionList[j];
							}
						}
					}
				}
			}
		}
		
		//Have the transitions revalidate
		for(var i = 0; i < this.transitionList.length; i++) {
			this.transitionList[i].onChange();
		}
		
		//Have the states revalidate
		for(var i = 0; i < this.stateList.length; i++) {
			this.stateList[i].onChange();
		}

		this.busy.close();
	},
	
	loadError : function() {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.loadingError"));
		this.busy.close();
	},
	
	reloadGame : function(gameId) {
		GameEditor.getEditorController().resetEditor();
		GameEditor.getEditorController().gameModel.gameId = gameId;
		GameEditor.getEditorController().load();
	},

	saveGame : function() {
		
		//This is a save without a run
		this.saveRun = false;
		
		//Check to make sure the owner is saving
		if(this.gameModel.username.usernameId != sap.ui.getCore().getModel("user").oData.username) {
			if(this.saveRun) {
				return;
			} else {
				sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.editCopy"));
				return;
			}
		}
		
		//Open the busy dialog
		this.busy = new sap.m.BusyDialog();
		this.busy.open();

		//Save the game
		this.save();
	},
	
	save : function() {
		
		//Container for all of the data to be sent
		var saveJSON = {
				gameId : this.gameModel.gameId,
				teamCount : this.gameModel.teamCount,
				playersPerTeam : this.gameModel.playersPerTeam,
				stateIdCount : this.gameModel.stateIdCount,
				transitionIdCount : this.gameModel.transitionIdCount,
				connectionIdCount : this.gameModel.connectionIdCount,
				visibility : this.gameModel.visibility,
				dataLog : this.gameModel.dataLog,
				username : this.gameModel.username,
				states : [],
				connections : [],
				transitions :[]
		}
		
		//Loop through and save all of the states
		for(var i = 0; i < this.stateList.length; i++) {
			saveJSON.states.push(this.stateList[i].save());
		}
		
		//Loop through and save all of the connections
		for(var i = 0; i < this.connectionList.length; i++) {
			saveJSON.connections.push(this.connectionList[i].save());
		}
		
		//Loop through all of the transition
		for(var i = 0; i < this.transitionList.length; i++) {
			saveJSON.transitions.push(this.transitionList[i].save());
		}
		
		var seen = [];
		var stringify = JSON.stringify(saveJSON, function(key, val) {
			   if (val != null && typeof val == "object") {
			        if (seen.indexOf(val) >= 0) {
			            return;
			        }
			        seen.push(val);
			    }
			    return val;
			});

		this.busy.close();

		RestAPIHelper.post("/gameController/saveGame", saveJSON, true, this.saveSuccess, this.saveError, this);
	},
	
	saveSuccess : function() {
		if(this.saveRun) {
			sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.transpileDebug"));
			RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/checkDebugInstanceRunning/" + sap.ui.getCore().getModel("user").oData.username, true, this.checkForRunningDebugInstanceSuccess, this.checkForRunningDebugInstanceError, this);
		}

		// BUG: IS THERE A WAY TO DIFFERENTIATE BETWEEN PRESSING THE BUTTON AND AUTOSAVES FROM RUN AND DEBUG?
		// Log BUTTON_PRESS event: button-save-game
		Logger.info("Game saved")
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS,
				MetricsHelper.LogContext.GAME_EDITOR,
				this.gameModel.gameId,
				"button-save-game"
			)
		);

		//MetricsHelper.saveLogEvent(MetricsHelper.createBasicPayload(MetricsHelper.LogEventType.BUTTON_PRESS, MetricsHelper.LogContext.GAME_EDITOR, this.gameModel.gameId));
	},
	
	saveError : function() {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.saveError"));
	},
	
	runGame : function() {
		this.saveRun = true;
		this.save();

		// Log BUTTON_PRESS event: button-run-debug
		// Run and Debug button pressed
		Logger.info("Run and debug clicked")
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS,
				MetricsHelper.LogContext.GAME_EDITOR,
				this.gameModel.gameId,
				"button-run-debug"
			)
		);
	},
	
	checkForRunningDebugInstanceSuccess : function(data) {
		if(data == true) {
			sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.alreadyDebugging"), {actions : [sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.debugger.newInstance"), sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.debugger.existingInstance"), sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel")],onClose : $.proxy(this.handleDebugInstanceMessageBox, this)});
		} else {
			RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startDebugGameInstance", {gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : false}, true, this.openDebuggerWindow, this.checkForRunningDebugInstanceError, this);
		}
	},
	
	checkForRunningDebugInstanceError : function() {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.debugError"));
	},
	
	handleDebugInstanceMessageBox : function(oAction) {
		if(oAction == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.debugger.newInstance")) {
			RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startDebugGameInstance", {gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : true}, true, this.openDebuggerWindow, this.checkForRunningDebugInstanceError, this);
		} else if(oAction == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.debugger.existingInstance")) {
			RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startDebugGameInstance", {gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : false}, true, this.openDebuggerWindow, this.checkForRunningDebugInstanceError, this);
		} 
	},
	
	openDebuggerWindow : function(debugGameInstanceId) {
		this.debuggerWindow = window.open(window.location.origin + window.location.pathname + "#/RouteVirtualDeviceView/" + sap.ui.getCore().getModel("user").oData.username + "/" + debugGameInstanceId + "/true");
	},
	
	/**
	 * Called when the Copy Game option within Game Options menu is pressed
	 * @param {*} oEvent 
	 */
	copyGame : function(oEvent) {

		var dialog = new sap.m.Dialog({
			
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.title"),
			
			content : [new sap.m.Input({
				placeholder : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.placeholder")
			}), new sap.m.CheckBox({text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.new.public"), selected : true})],
			
			beginButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.title"),
				type : sap.m.ButtonType.Accept,
				press : $.proxy(function(oAction) {
					var newGameId = oAction.oSource.getParent().mAggregations.content[0].getValue();
					if(!newGameId.match(/^[a-zA-Z]+$/)) {
						sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.gameNameError"));
						return;
					}
					RestAPIHelper.post("/gameController/copyGame", {oldGameId : this.gameModel.gameId, newGameId : newGameId, usernameId : sap.ui.getCore().getModel("user").oData.username, visibility : oAction.oSource.getParent().mAggregations.content[1].getSelected()}, true, 
					function(data) {
						sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.copied"));
						dialog.close();
						this.reloadGame(newGameId);
					},
					function error(error) {
						//Default error handling.

						dialog.close();
					}, this);
				}, this)
			}),

			endButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel"),
				type : sap.m.ButtonType.Reject,
				press : function() {
					
					// Log BUTTON_PRESS event: button-copy-game-cancel
					// Copy game - Cancel button pressed
					Logger.info("Copy game: Cancel button pressed");
					MetricsHelper.saveLogEvent(
						MetricsHelper.createButtonPayload(
							MetricsHelper.LogEventType.BUTTON_PRESS, 
							MetricsHelper.LogContext.GAME_EDITOR, 
							GameEditor.getEditorController().gameModel.gameId, 
							"button-copy-game-cancel"
						)
					);

					dialog.close();
				}
			}),

			afterClose : function() {
				dialog.destroy();
			}

		});
		
		// Log BUTTON_PRESS event: button-copy-game
		// Copy game button pressed
		Logger.info("Copy game button pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-copy-game"
			)
		);

		dialog.addStyleClass("sapUiPopupWithPadding");
		dialog.open();
	},
	

	/**
	 * Called when the Rename Game option within Game Options menu is pressed
	 * @param {*} oEvent 
	 */
	renameGame : function(oEvent) {

		var dialog = new sap.m.Dialog({

			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.rename.title"),
			
			content : new sap.m.Input({
				placeholder : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.rename.placeholder")
			}),
			
			beginButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.rename.title"),
				type : sap.m.ButtonType.Accept,
				press : $.proxy(function(oAction) {

					var newGameId = oAction.oSource.getParent().mAggregations.content[0].getValue();
					
					if(!newGameId.match(/^[a-zA-Z]+$/)) {
						sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.gameNameError"));
						return;
					}
					
					RestAPIHelper.post(
						"/gameController/renameGame", 
						{oldGameId : this.gameModel.gameId, newGameId : newGameId, usernameId : sap.ui.getCore().getModel("user").oData.username}, 
						true, 

						function(data) {
							sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.renamed"));

							// Log BUTTON_PRESS event: button-rename-game-confirm
							// Rename game - Rename Game button pressed
							Logger.info("Rename game: Rename confirm button pressed");
							MetricsHelper.saveLogEvent(
								MetricsHelper.createButtonPayload(
									MetricsHelper.LogEventType.BUTTON_PRESS, 
									MetricsHelper.LogContext.GAME_EDITOR, 
									GameEditor.getEditorController().newGameModel.gameId, 
									"button-rename-game-confirm"
								)
							);

							dialog.close();
							this.reloadGame(newGameId);
						},

						function error(error) {
							//Default error handling.
							dialog.close();
						}, this
					);
				}, this)
			}),

			endButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel"),
				type : sap.m.ButtonType.Reject,
				press : function() {

					// Log BUTTON_PRESS event: button-rename-game-cancel
					// Rename game - Cancel button pressed
					Logger.info("Rename game: Cancel button pressed");
					MetricsHelper.saveLogEvent(
						MetricsHelper.createButtonPayload(
							MetricsHelper.LogEventType.BUTTON_PRESS, 
							MetricsHelper.LogContext.GAME_EDITOR, 
							GameEditor.getEditorController().gameModel.gameId, 
							"button-rename-game-cancel"
						)
					);

					dialog.close();
				}
			}),
			afterClose : function() {
				dialog.destroy();
			}
		});

		// Log BUTTON_PRESS event: button-rename-game
		// Rename game button pressed
		Logger.info("Rename game button pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-rename-game"
			)
		);

		dialog.addStyleClass("sapUiPopupWithPadding");
		dialog.open();
	},
	
	/**
	 * Called when the Delete Game option within Game Options menu is pressed
	 * @param {*} oEvent 
	 */
	deleteGame : function(oEvent) {

		sap.m.MessageBox.confirm(

			// The given message
			sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.delete.confirm"), { 

				// The icon to display
				icon : sap.m.MessageBox.Icon.WARNING, 

				// Callback to be called when the user closes the dialog
				onClose : $.proxy(

					function(oAction) {

						// Case when the user presses the OK button on the Delete Game dialog
						if(oAction == sap.m.MessageBox.Action.OK) {

							RestAPIHelper.post(
								"/gameController/deleteGame", 
								{oldGameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username}, 
								true, 
							
								function(data) {
									this.resetEditor();
									sap.ui.getCore().byId("container-wlcp-ui---gameEditor--saveButton").setEnabled(false);
									sap.ui.getCore().byId("container-wlcp-ui---gameEditor--runButton").setEnabled(false);
									sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").setEnabled(false);
									sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.deleted"))
								},
								
								function error(error) {
									//Default error handling.
								}, this
							);

							// Log BUTTON_PRESS event: button-delete-game-confirm
							// Delete Game OK button pressed
							Logger.info("Delete Game: OK button pressed");
							MetricsHelper.saveLogEvent(
								MetricsHelper.createButtonPayload(
									MetricsHelper.LogEventType.BUTTON_PRESS, 
									MetricsHelper.LogContext.GAME_EDITOR, 
									this.gameModel.gameId, 
									"button-delete-game-confirm"
								)
							);
						}

						// Case when the user presses the Cancel button on the Delete Game dialog
						else if (oAction == sap.m.MessageBox.Action.CANCEL) {

							// Log BUTTON_PRESS event: button-delete-game-cancel
							// Delete Game cancel button pressed
							Logger.info("Delete Game: Cancel button pressed");
							MetricsHelper.saveLogEvent(
								MetricsHelper.createButtonPayload(
									MetricsHelper.LogEventType.BUTTON_PRESS, 
									MetricsHelper.LogContext.GAME_EDITOR, 
									this.gameModel.gameId, 
									"button-delete-game-cancel"
								)
							);
							
						}

					}, this
				)
			});
	},

	/**
	 * Called when the Game Properties option within Game Options menu is pressed
	 * @param {*} oEvent 
	 */
	gameProperties : function(oEvent) {
		var dialog = new sap.m.Dialog({
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.gameOptions.gameProperties"),
			content : [new sap.m.CheckBox({text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.gameProperties.visibility"), selected : this.gameModel.visibility})],
			beginButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.accept"),
				type : sap.m.ButtonType.Accept,
				press : $.proxy(function(oAction) {
					this.gameModel.visibility = oAction.oSource.getParent().mAggregations.content[0].getSelected();
					this.saveGame();
					dialog.close();
					dialog.destroy();

					// Log BUTTON_PRESS event: button-game-properties-accept
					// Game Properties Accept button pressed
					Logger.info("Game Properties: Accept button pressed");
					MetricsHelper.saveLogEvent(
						MetricsHelper.createButtonPayload(
							MetricsHelper.LogEventType.BUTTON_PRESS, 
							MetricsHelper.LogContext.GAME_EDITOR, 
							this.gameModel.gameId, 
							"button-game-properties-accept"
						)
					);

				}, this)
			}),
			endButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel"),
				type : sap.m.ButtonType.Reject,
				press : function() {
					dialog.close();

					// Log BUTTON_PRESS event: button-game-properties-cancel
					// Game Properties cancel button pressed
					Logger.info("Game Properties: Cancel button pressed");
					MetricsHelper.saveLogEvent(
						MetricsHelper.createButtonPayload(
							MetricsHelper.LogEventType.BUTTON_PRESS, 
							MetricsHelper.LogContext.GAME_EDITOR, 
							GameEditor.getEditorController().gameModel.gameId, 
							"button-game-properties-cancel"
						)
					);
				}
			}),
			afterClose : function() {
				dialog.destroy();
			}
		});
		dialog.addStyleClass("sapUiPopupWithPadding");
		dialog.open();

		// Log BUTTON_PRESS event: button-game-properties
		// Game Properties button pressed
		Logger.info("Game Properties button pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-game-properties"
			)
		);
	},
	
	resetEditor : function() {
		for(var i = 0; i < this.stateList.length; i++) {
			this.jsPlumbInstance.remove(this.stateList[i].htmlId);
		}
		this.stateList = [];
		this.connectionList = [];
		this.transitionList = [];
		this.saveCount = null;
		this.type = null;
		
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--saveButton").setEnabled(true);
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--runButton").setEnabled(true);
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").setEnabled(true);

		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--padPage").setTitle("No Game Loaded!");
		
		GameEditor.resetScroll();
	},
	
	onGotoLogin: function() {

		var mylocation = location; mylocation.reload();
	},

	onHomeButtonPress : function() {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");

		// Log BUTTON_PRESS event: button-home
		// Home button pressed
		Logger.info("Home button pressed")
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-home"
			)
		);

	},
	
	/**
	 * Called when the Quick start game editor button is pressed
	 */
	quickStartHelp : function() {
		this.quickStartHelpDialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.QuickStartHelp", this);
		this.quickStartHelpDialog.open();

		// Log BUTTON_PRESS event: button-quickstart-open
		// Quick Start button pressed
		Logger.info("Quick Start button pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-quickstart-open"
			)
		);

	},

	/**
	 * Called when the side-scrolling arrows are clicked on the Quick Start Help carousel
	 * @param {*} oEvent 
	 */
	quickStartPageChanged : function(oEvent) {
		var test1 = oEvent.getSource()
		Logger.info(test1.getActivePage());
		Logger.info("Page changed")
	},
	
	/**
	 * Called when the Quick start game editor dialog is closed
	 */
	closeQuickStartHelp : function() {
		this.quickStartHelpDialog.close();
		this.quickStartHelpDialog.destroy();

		// Log BUTTON_PRESS event: button-quickstart-close 
		// Quick Start Close button pressed
		Logger.info("Quick Start Close dialog button pressed")
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				this.gameModel.gameId, 
				"button-quickstart-close"
			)
		);
	},
	
	quickStartCookie : function() {
		if (document.cookie.split(';').filter((item) => item.trim().startsWith('lastAccess=')).length) {
			let cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)lastAccess\s*\=\s*([^;]*).*$)|^.*$/, "$1");
			if(Date.now() - Date.parse(cookieValue) > 7 * 24 * 60 * 60 * 1000) { //if last access more than 7 days ago
				this.quickStartHelp();
			}
		} else {
			this.quickStartHelp();
		}
		document.cookie = "lastAccess=" + new Date().toString();
	},
	
/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.GameEditor
*/
	onInit: function() {
		
		window.onbeforeunload = function() {
			return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.confirmExit");
		};	

		//No Game Loaded
		sap.ui.getCore().byId("container-wlcp-ui---gameEditor--padPage").setTitle("No Game Loaded!");

		sap.ui.core.UIComponent.getRouterFor(this).getRoute("RouteGameEditorView").attachMatched(this.onRouteMatched, this);
	},

	onRouteMatched : function (oEvent) {

		//Setup scrolling via mouse
		this.setupScrolling();

		//Load the toolbox text
		this.initToolboxText();

		//Load the quickstart help
		if(!document.URL.includes("localhost")) {
			this.quickStartHelp();
		}
	},

	setupScrolling : function() {
		var scrollPlaceHolder = document.createElement('div');
		scrollPlaceHolder.id = "scrollPlaceHolder";
		scrollPlaceHolder.style.height = "1px";
		scrollPlaceHolder.style.width = "1px";
		scrollPlaceHolder.style.position = "absolute";
		document.getElementById("container-wlcp-ui---gameEditor--pad").appendChild(scrollPlaceHolder);
		document.getElementById("container-wlcp-ui---gameEditor--pad").addEventListener("mousemove", $.proxy(GameEditor.getEditorController().scroller.handleMousemove, GameEditor.getEditorController().scroller), false);
		document.getElementById("container-wlcp-ui---gameEditor--pad").addEventListener("mousedown", function(event) {
			GameEditor.getEditorController().scroller.leftMouseDown = true;
		}, false);
		document.getElementById("container-wlcp-ui---gameEditor--pad").addEventListener("mouseup", function(event) {
			GameEditor.getEditorController().scroller.leftMouseDown = false;
			GameEditor.getEditorController().scroller.handleMousemove(event);
		}, false);
	},
	
	// setupScrolling : function() {
	// 	var that = this;
	// 	this.oldX = 0;
	// 	this.oldY = 0;
	// 	document.getElementById("container-wlcp-ui---gameEditor--pad").onmousemove = function (e) {
	// 		that.clicked && that.updateScrollPos(e);
	// 	}
		
	// 	document.getElementById("container-wlcp-ui---gameEditor--pad").onmousedown = function (e) {
	// 		that.clicked = true;
	// 		that.oldX = e.pageX;
	// 		that.oldY = e.pageY;
	// 	}
		
	// 	document.getElementById("container-wlcp-ui---gameEditor--pad").onmouseup = function (e) {
	// 		that.clicked = false;
	//         $('html').css('cursor', 'auto');
	// 	}

	// 	var scrollPlaceHolder = document.createElement('div');
	// 	scrollPlaceHolder.id = "scrollPlaceHolder";
	// 	scrollPlaceHolder.style.height = "1px";
	// 	scrollPlaceHolder.style.width = "1px";
	// 	scrollPlaceHolder.style.position = "absolute";
	// 	document.getElementById("container-wlcp-ui---gameEditor--pad").appendChild(scrollPlaceHolder);
	// },
	
	// updateScrollPos : function(e) {
	//     $('html').css('cursor', 'row-resize');
	//     document.getElementById("container-wlcp-ui---gameEditor--pad").scrollBy(this.oldX - e.pageX, this.oldY - e.pageY);
	//     this.oldX = e.pageX;
	//     this.oldY = e.pageY;    
	// },

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf wlcpfrontend.views.GameEditor
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf wlcpfrontend.views.GameEditor
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf wlcpfrontend.views.GameEditor
*/
//	onExit: function() {
//
//	}

});
