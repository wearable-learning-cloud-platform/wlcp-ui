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
		var startState = new StartState("startStateTopColor", "startStateBottomColor", sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.startState") , this.gameModel.gameId + "_start", this.jsPlumbInstance);
		
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
		$("#container-wlcp-ui---gameEditor--toolboxTransition")[0].children[0].children[0].innerHTML = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition").split(" ")[0];
		$("#container-wlcp-ui---gameEditor--toolboxTransition")[0].children[0].children[1].innerHTML = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition").split(" ")[1];
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
		
		if(State.absoluteToRelativeX(ui.position.left, 150) + GameEditor.getScrollLeftOffset() < 0 || State.absoluteToRelativeY(ui.position.top) + GameEditor.getScrollTopOffset() < 0) {sap.m.MessageBox.error("A state could not be placed there!"); return;}
		var outputState = new OutputState("toolboxOutputStateTopColor", "toolboxOutputStateBottomColor", sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState") , this.createStateId(), this.jsPlumbInstance);
		outputState.setPositionX(State.absoluteToRelativeX(ui.position.left, 150) + GameEditor.getScrollLeftOffset()); outputState.setPositionY(State.absoluteToRelativeY(ui.position.top) + GameEditor.getScrollTopOffset());
		outputState.addPadSpace();
		outputState.draw();
		this.stateList.push(outputState);
		DataLogger.logGameEditor();
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
				if(this.stateList[i].htmlId == connection.targetId) {
					this.stateList[i].onChange();
				}
			}
			DataLogger.logGameEditor();
		} else {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.cannotPlaceTransition"));
		}
	},
	
	connectionDropped : function(oEvent) {
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
		return false;
	},
	
	connectionDetached : function(oEvent) {
		var i = 0;
		var that = this;
		if(oEvent.suspendedElementId == oEvent.targetId || typeof oEvent.suspendedElementId === "undefined") {
			for(var i = 0; i < this.connectionList.length; i++) {
				if(this.connectionList[i].connectionId == oEvent.id) {
					if(this.connectionList[i].connectionFrom.getActiveScopes().length > 0) {
						sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validationEngine"), {title:sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validation.title"), onClose : function (oEvent2) {
							if(oEvent2 == sap.m.MessageBox.Action.OK) {
								var connectionFrom = that.connectionList[i].connectionFrom.htmlId;
								var connectionTo = that.connectionList[i].connectionTo.htmlId;
								that.connectionList[i].detach();
								GameEditor.getJsPlumbInstance().deleteConnection(GameEditor.getJsPlumbInstance().getConnections({source : connectionFrom, target : connectionTo})[0], {fireEvent : false, force : true});
								DataLogger.logGameEditor();
						}}});
						return false;
					} else {
						this.connectionList[i].detach();
						DataLogger.logGameEditor();
						return true;
					}
				}
			}
		}
	},

	createStateId : function() {
		this.gameModel.stateIdCount++;
		return this.gameModel.gameId + "_state_" + this.gameModel.stateIdCount;
	},
	
	createTransitionId : function() {
		this.gameModel.transitionIdCount++;
		return this.gameModel.gameId + "_transition_" + this.gameModel.transitionIdCount;
	},
	
	createConnectionId : function() {
		this.gameModel.connectionIdCount++;
		return this.gameModel.gameId + "_connection_" + this.gameModel.connectionIdCount;
	},
	
	newGame : function() {
		var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.CreateGame", sap.ui.controller("org.wlcp.wlcp-ui.controller.CreateLoadGame"));
		fragment.setModel(new sap.ui.model.json.JSONModel(this.newGameModel));
		fragment.open();
	},
	
	initNewGame : function() {
		
		//Init jsPlumb
		this.initJsPlumb();
		  
		//Init the start state
		this.initStartState();
		  
		//Setup the toolbox drag and drop
		this.initToolbox();
	},
	
	loadGame : function() {
		var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.LoadGame", sap.ui.controller("org.wlcp.wlcp-ui.controller.CreateLoadGame"));
		var loadGameDialogModel = {
			privateGames : null,
			publicGames : null
		};
		$.ajax({
			url: ServerConfig.getServerAddress() + "/loadGameController/getPrivateGames?usernameId=" + sap.ui.getCore().getModel("user").oData.username, 
			type: 'GET',
			async : false,
			success: function(data) {
				loadGameDialogModel.privateGames = data.object;
			},
			error : function() {

			}
		});
		$.ajax({
			url: ServerConfig.getServerAddress() + "/loadGameController/getPublicGames", 
			type: 'GET',
			async : false,
			success: function(data) {
				loadGameDialogModel.publicGames = data.object;
			},
			error : function() {

			}
		});
		fragment.setModel(new sap.ui.model.json.JSONModel(loadGameDialogModel));
		fragment.open();
	},
	
	load : function() {
		
		//Open the busy dialog
		this.busy = new sap.m.BusyDialog();
		this.busy.open();
		
		$.ajax({url: ServerConfig.getServerAddress() + "/loadGameController/loadGame?gameId=" + this.gameModel.gameId, type: 'GET', success: $.proxy(this.loadSuccess, this), error : $.proxy(this.loadError, this)});
	},
	
	loadSuccess(loadedData) {

		loadedData = loadedData.object;

		this.gameModel.gameId = loadedData.gameId;
		this.gameModel.teamCount = loadedData.teamCount;
		this.gameModel.playersPerTeam = loadedData.playersPerTeam;
		this.gameModel.visibility = loadedData.visibility;
		this.gameModel.stateIdCount = loadedData.stateIdCount;
		this.gameModel.transitionIdCount = loadedData.transitionIdCount;
		this.gameModel.connectionIdCount = loadedData.connectionIdCount;
		this.gameModel.username.usernameId = loadedData.username.usernameId;
		
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
		
		$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getServerAddress() + "/gameController/saveGame", type: 'POST', dataType: 'json', data: JSON.stringify(saveJSON), success : $.proxy(this.saveSuccess, this), error : $.proxy(this.saveError, this)});
	},
	
	saveSuccess : function() {
		this.busy.close();
		if(this.saveRun) {
			sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.transpileDebug"));
			$.ajax({url: ServerConfig.getGameServerAddress() + "/gameInstanceController/checkDebugInstanceRunning/" + sap.ui.getCore().getModel("user").oData.username, type: 'GET', success : $.proxy(this.checkForRunningDebugInstanceSuccess, this), error : $.proxy(this.checkForRunningDebugInstanceError, this)});
		}
	},
	
	saveError : function() {
		this.busy.close();
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.saveError"));
	},
	
	runGame : function() {
		this.saveRun = true;
		this.save();
	},
	
	run : function() {
		//Open the busy dialog
		this.busy = new sap.m.BusyDialog();
		this.busy.open();
	},
	
	checkForRunningDebugInstanceSuccess : function(data) {
		if(data == true) {
			sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.alreadyDebugging"), {onClose : $.proxy(this.handleDebugInstanceMessageBox, this)});
		} else {
			$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getGameServerAddress() + "/gameInstanceController/startDebugGameInstance", type: 'POST', dataType: 'json', data: JSON.stringify({gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : false}), success : $.proxy(this.openDebuggerWindow, this), error : $.proxy(this.checkForRunningDebugInstanceError, this)});
		}
	},
	
	checkForRunningDebugInstanceError : function() {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.debugError"));
	},
	
	handleDebugInstanceMessageBox : function(oAction) {
		if(oAction == sap.m.MessageBox.Action.OK) {
			$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getGameServerAddress() + "/gameInstanceController/startDebugGameInstance", type: 'POST', dataType: 'json', data: JSON.stringify({gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : true}), success : $.proxy(this.openDebuggerWindow, this), error : $.proxy(this.checkForRunningDebugInstanceError, this)});
		} else {
			$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getGameServerAddress() + "/gameInstanceController/startDebugGameInstance", type: 'POST', dataType: 'json', data: JSON.stringify({gameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username, restart : false}), success : $.proxy(this.openDebuggerWindow, this), error : $.proxy(this.checkForRunningDebugInstanceError, this)});
		} 
	},
	
	openDebuggerWindow : function(debugGameInstanceId) {
		this.debuggerWindow = window.open(window.location.origin + window.location.pathname + "#/RouteVirtualDeviceView/" + sap.ui.getCore().getModel("user").oData.username + "/" + debugGameInstanceId + "/true");
	},
	
	openGameOptions : function(oEvent) {
		if(!this.gameOptionsPopover) {
			this.gameOptionsPopover = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.GameOptions", this);
			this.getView().addDependent(this.gameOptionsPopover);
		}
		this.gameOptionsPopover.openBy(oEvent.getSource());
	},
	
	copyGame : function(oEvent) {
		var dialog = new sap.m.Dialog({
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.title"),
			content : new sap.m.Input({
				placeholder : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.placeholder")
			}),
			beginButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.title"),
				type : sap.m.ButtonType.Accept,
				press : $.proxy(function(oAction) {
					var newGameId = oAction.oSource.getParent().mAggregations.content[0].getValue();
					if(!newGameId.match(/^[a-zA-Z]+$/)) {
						sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.gameNameError"));
						return;
					}
					$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getServerAddress() + "/gameController/copyGame", type: 'POST', dataType: 'json', data: JSON.stringify({oldGameId : this.gameModel.gameId, newGameId : newGameId, usernameId : sap.ui.getCore().getModel("user").oData.username}), success : $.proxy(function(data) {
						sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.copied"));
						dialog.close();
						this.reloadGame(newGameId);
					}, this), error : $.proxy(function(data) {
						dialog.close();
						sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.copy.error"))
					}, this)});
				}, this)
			}),
			endButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel"),
				type : sap.m.ButtonType.Reject,
				press : function() {
					dialog.close();
				}
			}),
			afterClose : function() {
				dialog.destroy();
			}
		});
		dialog.addStyleClass("sapUiPopupWithPadding");
		dialog.open();
	},
	
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
					$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getServerAddress() + "/gameController/renameGame", type: 'POST', dataType: 'json', data: JSON.stringify({oldGameId : this.gameModel.gameId, newGameId : newGameId, usernameId : sap.ui.getCore().getModel("user").oData.username}), success : $.proxy(function(data) {
						sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.renamed"));
						dialog.close();
						this.reloadGame(newGameId);
					}, this), error : $.proxy(function(data) {
						dialog.close();
						sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.rename.error"))
					}, this)});
				}, this)
			}),
			endButton : new sap.m.Button({
				text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("button.cancel"),
				type : sap.m.ButtonType.Reject,
				press : function() {
					dialog.close();
				}
			}),
			afterClose : function() {
				dialog.destroy();
			}
		});
		dialog.addStyleClass("sapUiPopupWithPadding");
		dialog.open();
	},
	
	deleteGame : function(oEvent) {
		sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.delete.confirm"), { icon : sap.m.MessageBox.Icon.WARNING, onClose : $.proxy(function(oAction) {
			if(oAction == sap.m.MessageBox.Action.OK) {
				$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'}, url: ServerConfig.getServerAddress() + "/gameController/deleteGame", type: 'POST', dataType: 'json', data: JSON.stringify({oldGameId : this.gameModel.gameId, usernameId : sap.ui.getCore().getModel("user").oData.username}), success : $.proxy(function(data) {
					this.resetEditor();
					sap.ui.getCore().byId("container-wlcp-ui---gameEditor--saveButton").setEnabled(false);
					sap.ui.getCore().byId("container-wlcp-ui---gameEditor--runButton").setEnabled(false);
					sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").setEnabled(false);
					sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.deleted"))
				}, this), error : $.proxy(function(data) {
					sap.m.MessageToast.show(data.responseText);
				}, this)});
			}
		}, this)});
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
		
		GameEditor.resetScroll();
	},
	
	onGotoLogin: function() {

		var mylocation = location; mylocation.reload();
	},

	onHomeButtonPress : function() {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");
	},
	
	quickStartHelp : function() {
		this.quickStartHelpDialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.QuickStartHelp", this);
		this.quickStartHelpDialog.open();
	},
	
	closeQuickStartHelp : function() {
		this.quickStartHelpDialog.close();
		this.quickStartHelpDialog.destroy();
	},
	
	quickStartCookie : function() {
		if (document.cookie.split(';').filter((item) => item.trim().startsWith('lastAccess=')).length) {
			let cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)lastAccess\s*\=\s*([^;]*).*$)|^.*$/, "$1");
			if(Date.now() - Date.parse(cookieValue) > 7 * 24 * 60 * 60 * 1000) { //if last access more than 7 days ago
				this.quickStartHelp();
			}
		} else {
			console.log(document.cookie)
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
		var that = this;
		this.oldX = 0;
		this.oldY = 0;
		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-1").onmousemove = function (e) {
			that.clicked && that.updateScrollPos(e);
		}
		
		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-1").onmousedown = function (e) {
			that.clicked = true;
			that.oldX = e.pageX;
			that.oldY = e.pageY;
		}
		
		document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-1").onmouseup = function (e) {
			that.clicked = false;
	        $('html').css('cursor', 'auto');
		}
	},
	
	updateScrollPos : function(e) {
	    $('html').css('cursor', 'row-resize');
	    document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-content-1").scrollBy(this.oldX - e.pageX, this.oldY - e.pageY);
	    this.oldX = e.pageX;
	    this.oldY = e.pageY;    
	},

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