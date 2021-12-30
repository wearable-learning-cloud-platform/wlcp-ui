var InputTransition = class InputTransition extends Transition {
	
	constructor(cssClass, connection, overlayId, gameEditor) {

		super(cssClass, connection, overlayId, gameEditor);

		this.create();

		this.modelJSON = {
				iconTabs : []
		}

		this.oldModelJSON = {};
		this.transitionConfigs = [];
		this.setupTransitionConfigs();
		
		this.modelJSON.iconTabs = this.generateData(
			GameEditor.getEditorController().gameModel.teamCount, 
			GameEditor.getEditorController().gameModel.playersPerTeam
		);
		
		this.model = new sap.ui.model.json.JSONModel(this.modelJSON);
		this.validationRules = [];
		this.setupValidationRules();
		this.scopeMask = 0xffffffff;
		this.oldActiveScopes = [];

	}
	
	create() {
		
		this.jsPlumbConnection = GameEditor.getJsPlumbInstance().getConnections({ source : this.connection.connectionFrom.htmlId, target : this.connection.connectionTo.htmlId})[0];
		
		//Add the overlay
		this.jsPlumbConnection.addOverlay([ "Label", {id : this.overlayId, label: "<div id=" + "\"" + this.overlayId + "_delete\"" + "class=\"close2-thik\"></div><div class=\"centerTransitionText\"/><div>" + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition") + "</div></div>", cssClass : this.cssClass + " jtk-drag-select"}]);
		
		//Store the id
		for(var key in this.jsPlumbConnection.getOverlays()) {
			if(this.jsPlumbConnection.getOverlays()[key].hasOwnProperty("label")) {
				  this.htmlId = this.jsPlumbConnection.getOverlays()[key].canvas.id;
				  break;
			}
		}
		
		//Setup double click
		$("#"+this.htmlId).dblclick($.proxy(this.doubleClick, this));
		
		//Setup delete click
		$("#" + this.overlayId + "_delete").click($.proxy(this.remove, this));
	}
	
	setupTransitionConfigs() {
		this.transitionConfigs.push(new TransitionConfigSingleButtonPress(this));
		this.transitionConfigs.push(new TransitionConfigSequenceButtonPress(this));
		this.transitionConfigs.push(new TransitionConfigKeyboardInput(this));
		this.transitionConfigs.push(new TransitionConfigTimer(this));
		this.transitionConfigs.push(new TransitionConfigRandom(this));
	}
	
	setupValidationRules() {
		this.validationRules.push(new TransitionValidationRule());
	}
	
	/**
	 * Called when Transition Editor properties (button press) are changed
	 * @param {*} oEvent 
	 */
	onChange(oEvent, validateTransitionConfigs = true, dialogOnChange = true) {

		for(var i = 0; i < this.validationRules.length; i++) {
			this.validationRules[i].validate(this);
		}
		
		if(validateTransitionConfigs) {
			for(var i = 0; i < this.transitionConfigs.length; i++) {
				for(var n = 0; n < this.transitionConfigs[i].validationRules.length; n++) {
					this.transitionConfigs[i].validationRules[n].validate(this, true, dialogOnChange);
				}
			}
		}
		
		if(typeof this.dialog !== "undefined") { 
			if(this.dialog.isOpen()) { 
				this.onAfterRenderingDialog(); 
			}
		}

	}
	
	revalidate() {
		for(var i = 0; i < this.validationRules.length; i++) {
			this.validationRules[i].validate(this, true, true);
		}
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			for(var n = 0; n < this.transitionConfigs[i].validationRules.length; n++) {
				this.transitionConfigs[i].validationRules[n].validate(this);
			}
		}
	}
	
	setScope(bitMask, teamCount, playersPerTeam) {
		
		this.scopeMask = bitMask;
		var mask = bitMask;
		var model = this.modelJSON.iconTabs;
		var newTabs = [];
	
		//Test gamewide
		if(bitMask & 0x01) {
			var exists = false;
			for(var i = 0; i < model.length; i++) {
				if(model[i].scope == "Game Wide") {
					exists = true;
					newTabs.push(model[i]);
					break;
				}
			}
			if(!exists) {
				var data = this.createData();
				data.icon = "sap-icon://globe";
				data.scope = "Game Wide";
				data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.gameWide");
				newTabs.push(data);
			}
		}
		
		mask = mask >> 1;
		
		for(var i = 0; i < teamCount; i++) {
			if(mask & 0x01) {
				var exists = false;
				for(var n = 0; n < model.length; n++) {
					if(model[n].scope == "Team " + (i + 1)) {
						exists = true;
						newTabs.push(model[n]);
						break;
					}
				}
				if(!exists) {
					var data = this.createData();
					data.icon = "sap-icon://group";
					data.scope = "Team " + (i + 1);
					data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team") + " " + (i + 1);
					newTabs.push(data);
				}
			}	
			mask = mask >> 1;
		}	
		
		for(var i = 0; i < teamCount; i++) {
			for(var n = 0; n < playersPerTeam; n++) {
				if(mask & 0x01) {
					var exists = false;
					for(var j = 0; j < model.length; j++) {
						if(model[j].scope == "Team " + (i + 1) + " Player " + (n + 1)) {
							exists = true;
							newTabs.push(model[j]);
							break;
						}
					}
					if(!exists) {
						var data = this.createData();
						data.icon = "sap-icon://employee";
						data.scope = "Team " + (i + 1) + " Player " + (n + 1);
						data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team") + " " + (i + 1) + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.player") + " " + (n + 1);
						newTabs.push(data);
					}
				}
				mask = mask >> 1;
			}
		}
		
		this.modelJSON.iconTabs = newTabs;
		this.model.setData(this.modelJSON);
		
		if(typeof sap.ui.getCore().byId("inputTransitionDialogIconTabBar") !== "undefined") {
			var iconTabBar = sap.ui.getCore().byId("inputTransitionDialogIconTabBar").getItems();
			for(var i = 0; i < iconTabBar.length; i++) {
				for(var n = 0; n < iconTabBar[i].getContent()[0].getContentAreas()[1].getPages().length; n++) {
					var iconTabBarPage = iconTabBar[i].getContent()[0].getContentAreas()[1].getPages()[n];
					if(iconTabBarPage.getContent().length == 0) {
						var fragment = this.transitionConfigs[n].getTransitionConfigFragment();
						if(typeof fragment === 'object' && fragment.constructor === Array) {
							fragment.forEach(function (oElement) {iconTabBarPage.addContent(oElement);});
						} else {
							iconTabBarPage.addContent(fragment);
						}
					}
					iconTabBarPage.setTitle(iconTabBar[i].getProperty("text") + " " + this.transitionConfigs[n].getNavigationContainerPage().title);
				}
			}
		}
	}
	
	static load(loadData) {
		
		var connection = null;
		
		//Get the connection is transition should be placed on
		for(var n = 0; n < GameEditor.getEditorController().jsPlumbInstance.getConnections().length; n++) {
			if(GameEditor.getEditorController().jsPlumbInstance.getConnections()[n].id == loadData.connection) {
				connection = GameEditor.getEditorController().jsPlumbInstance.getConnections()[n];
				break;
			}
		}
		
		//if(typeof loadData.connection !== "undefined") {
			for(var i = 0; i < GameEditor.getEditorController().connectionList.length; i++) {
				if(GameEditor.getEditorController().connectionList[i].connectionId == loadData.connection) {
					connection = GameEditor.getEditorController().connectionList[i];
					connection.connectionFrom = { htmlId : connection.connectionFrom };
					connection.connectionTo = { htmlId : connection.connectionTo };
					break;
				}
			}
		//}
		
		//Place the transition
		var inputTransition = new InputTransition("transition", connection, loadData.transitionId, this);
		GameEditor.getEditorController().transitionList.push(inputTransition);
		
		//Load the component data
		inputTransition.loadComponents(loadData);
	}
	
	loadComponents(loadData) {
		for(var key in loadData.activeTransitions) {
			for(var n = 0; n < this.modelJSON.iconTabs.length; n++) {
				if(key == this.modelJSON.iconTabs[n].scope) {
					this.modelJSON.iconTabs[n].activeTransition = loadData.activeTransitions[key];
				}
			}
		}
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			this.transitionConfigs[i].setLoadData(loadData, this.modelJSON.iconTabs);
		}
	}
	
	save() {
		var activeTransitions = {};
		for(var i = 0; i < this.modelJSON.iconTabs.length; i++) {
			activeTransitions[this.modelJSON.iconTabs[i].scope] = this.modelJSON.iconTabs[i].activeTransition;
		}
		
		var saveData = {
			transitionId : this.overlayId,
			game : GameEditor.getEditorController().gameModel.gameId,
			connection : this.connection.connectionId,
			activeTransitions : activeTransitions,
		}
		
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			var data = this.transitionConfigs[i].getSaveData();
			for(var key in data) {
				saveData[key] = data[key];
			}
		}
		
		return saveData;
	}
	
	/**
	 * Called when the user double-clicks a transition
	 * @returns 
	 */
	doubleClick() {

		if(this.scopeMask == 0){
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.transition.filledScope"));
			// , {title:"test"} // For title of error box
			
			// Log TRANSITION event: transition-edit-attempt-error
			// User attempts to open the Transition editor on a transition,
			// but is shown an error because of an empty state before it
			Logger.info("Transition edit attempt error");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.overlayId, 
					JSON.stringify(this.modelJSON.iconTabs),
					this.connection.connectionId, 
					"transition-edit-attempt-error"
				)
			);

			return;
		}
		
		//Create an instance of the dialog
		this.dialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransition", this);
		
		//Set the model for the dialog
		this.dialog.setModel(this.model);
		
		//Setup the state config pages + models
		var iconTabBar = sap.ui.getCore().byId("inputTransitionDialogIconTabBar").getItems();
		for(var i = 0; i < iconTabBar.length; i++) {
			for(var n = 0; n < iconTabBar[i].getContent()[0].getContentAreas()[1].getPages().length; n++) {
				var iconTabBarPage = iconTabBar[i].getContent()[0].getContentAreas()[1].getPages()[n];
				if(iconTabBarPage.getContent().length == 0) {
					var fragment = this.transitionConfigs[n].getTransitionConfigFragment();
					if(typeof fragment === 'object' && fragment.constructor === Array) {
						fragment.forEach(function (oElement) {iconTabBarPage.addContent(oElement);});
					} else {
						iconTabBarPage.addContent(fragment);
					}
				}
				iconTabBarPage.setTitle(iconTabBar[i].getProperty("text") + " " + this.transitionConfigs[n].getNavigationContainerPage().title);
			}
		}
		
		//Set the old scope mask
		this.oldModelJSON = JSON.parse(JSON.stringify(this.modelJSON));
		
		//Set the old active scopes
		this.oldActiveScopes = this.getActiveScopes();
		this.oldScopeMask = this.scopeMask;

		//Set the default active transition type
		this.setDefaultActiveTransitionType();
		
		//Set the on after rendering
		this.dialog.onAfterRendering = $.proxy(this.onAfterRenderingDialog, this);

		this.dialog.attachAfterOpen($.proxy(this.onAfterOpen, this)); 
			
		//Open the dialog
		this.dialog.open();

		// Log TRANSITION event: transition-editor-dialog-open-success
		// User attempts to open the Transition editor dialog by double-clicking and is successful
		Logger.info("Transition editor: dialog opened");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createTransitionPayloadFull(
				MetricsHelper.LogEventType.TRANSITION, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.overlayId, 
				JSON.stringify(this.modelJSON.iconTabs),
				this.connection.connectionId, 
				"transition-editor-dialog-open-success"
			)
		);
	}
	
	onAfterRenderingDialog() {
		for(var i = 0; i < sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems().length; i++) {
			var navContainer = sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getContent()[0].getContentAreas()[1];
			var path = sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath() + "/activeTransition";
			var activeTransition = this.model.getProperty(path);
			var transitionTypes = this.model.getProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath() + "/navigationListItems");
			for(var n = 0; n < transitionTypes.length; n++) {
				if(transitionTypes[n].title == activeTransition) { transitionTypes[n].selected = true; }
				else { transitionTypes[n].selected = false; }
			}
			this.model.setProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath() + "/navigationListItems", transitionTypes);
			for(var n = 0; n < navContainer.getPages().length; n++) {
				if(navContainer.getPages()[n].getTitle().includes(activeTransition)) {
					navContainer.to(navContainer.getPages()[n]);
					break;
				}
			}
		}
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			this.transitionConfigs[i].onAfterRenderingDialog();
		}
	}

	onAfterOpen() {
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			this.transitionConfigs[i].onAfterOpen();
		}
	}

	setDefaultActiveTransitionType() {

		var transitionList = [];
		
		//Get a list of neighbor connections
		var neighborConnections = GameEditor.getJsPlumbInstance().getConnections({source : this.connection.connectionFrom.htmlId});
		
		//Loop through the neighbor connections
		for(var i = 0; i < neighborConnections.length; i++) {
			for(var n = 0; n < GameEditor.getEditorController().transitionList.length; n++) {
				if(neighborConnections[i].id == GameEditor.getEditorController().transitionList[n].connection.connectionId) {
					transitionList.push(GameEditor.getEditorController().transitionList[n]);
				}
			}
		}

		//Get the active scopes for this transition
		var activeScopes = this.getActiveScopes();

		//Loop through all of the scopes
		for(var i = 0; i < sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems().length; i++) {

			var scope = this.model.getProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath()).scope;
			var activeTransitionsAcrossAll = this.transitionConfigs[0].validationRules[0].getActiveTransitionTypeAcrossAll(transitionList, scope);

			//If a neighbor transition has an active scope
			if(activeTransitionsAcrossAll.length === 1 && activeTransitionsAcrossAll.includes("")) {
				if(!activeScopes.includes(scope)) {
					var activeTransition = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.singleButtonPress");
					this.model.setProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath() + "/activeTransition", activeTransition);
				}
			} else if(activeTransitionsAcrossAll.length > 0 && !activeTransitionsAcrossAll.includes("")) {
				//var activeTransition = TransitionConfigType.toString(activeTransitionsAcrossAll[0]);
				var activeTransition = null;
				for(var n = 0; n < this.modelJSON.iconTabs.length; n++) {
					if(this.modelJSON.iconTabs[n].scope === scope) {
						activeTransition = this.modelJSON.iconTabs[n].activeTransition;
					}
				}
				this.model.setProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getBindingContext().getPath() + "/activeTransition", activeTransition);
			}
		}
	}
	
	createData() {
		var tempNavigationListItems = [];
		var tempNavigationContainerPages = [];
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			tempNavigationListItems.push(this.transitionConfigs[i].getNavigationListItem());
			tempNavigationContainerPages.push(this.transitionConfigs[i].getNavigationContainerPage());
		}
		return {
			icon : "",
			scope : "",
			scopeText : "",
			activeTransition : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.singleButtonPress"),
			navigationListItems : tempNavigationListItems,
			navigationContainerPages : tempNavigationContainerPages
		}
	}
	
	generateData(teams, playersPerTeam) {
		
		//Create a new object to store the data
		var baseData = [];

		//Add game wide
		var data = this.createData();
		data.icon = "sap-icon://globe";
		data.scope = "Game Wide";
		data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.gameWide");
		baseData.push(data);
		
		//Add the teams
		for(var i = 0; i < teams; i++) {
			data = this.createData();
			data.icon = "sap-icon://group";
			data.scope = "Team " + (i + 1);
			data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team") + " " + (i + 1);
			baseData.push(data);
		}
		
		//Add the players
		for(var i = 0; i < teams; i++) {
			for(var n = 0; n < playersPerTeam; n++) {
				data = this.createData();
				data.icon = "sap-icon://employee";
				data.scope = "Team " + (i + 1) + " Player " + (n + 1);
				data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team") + " " + (i + 1) + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.player") + " " + (n + 1);
				baseData.push(data);
			}
		}
		
		return baseData;
	}
	
	transitionTypeSelected(oEvent, oParam) {
		this.model.setProperty(oEvent.getSource().getBindingContext() + "/activeTransition", oEvent.getParameters().listItem.getTitle());
		var transitionTypes = this.model.getProperty(oEvent.getSource().getBindingContext() + "/navigationListItems");
		for(var i = 0; i < transitionTypes.length; i++) {
			if(transitionTypes[i].title == oEvent.getParameters().listItem.getTitle()) { transitionTypes[i].selected = true; }
			else { transitionTypes[i].selected = false; }
		}
		this.model.setProperty(oEvent.getSource().getBindingContext() + "/navigationListItems", transitionTypes);
		var navContainer = oEvent.oSource.getParent().getContentAreas()[1];
		for(var i = 0; i < navContainer.getPages().length; i++) {
			if(navContainer.getPages()[i].getTitle().includes(oEvent.getParameters().listItem.getTitle())) {
				navContainer.to(navContainer.getPages()[i]);
				break;
			}
		}
	}
	
	/**
	 * Called when the user clicks the "Accept" button of the transition editor,
	 * potentially with changes to transition properties
	 * @returns 
	 */
    acceptDialog() {

    	if(JSON.stringify(this.oldActiveScopes) != JSON.stringify(this.getActiveScopes())) {
    		sap.m.MessageBox.confirm(
				sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validationEngine"), 
				{
					title:sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validation.title"), 
					onClose : $.proxy(this.acceptRevalidation, this)
				}
			);
    		return;
    	}

		this.validationRules[0].validate(this, true, true);
		this.onChange();
		this.dialog.close();
		this.dialog.destroy();

		// Log TRANSITION event: transition-editor-accept-noconfirm
		// Transition editor dialog is currently open, user may/may not edit transition type, 
		// and finally presses the Accept button in the editor dialog
		Logger.info("Transition editor: Accept - no confirm");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createTransitionPayloadFull(
				MetricsHelper.LogEventType.TRANSITION, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.overlayId, 
				JSON.stringify(this.modelJSON.iconTabs),
				this.connection.connectionId, 
				"transition-editor-accept-noconfirm"
			)
		);

		GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.editTransition"));
    }
    
	/**
	 * Called from acceptDialog() when the confirmation box is triggered
	 * @param {*} oEvent 
	 */
    acceptRevalidation(oEvent) {

		// CASE: User confirms by clicking "OK" on the "Accept" dialog
    	if(oEvent == sap.m.MessageBox.Action.OK) {
			this.validationRules[0].validate(this, true, true);
			this.onChange();
    		this.dialog.close();
    		this.dialog.destroy();

			// Log TRANSITION event: transition-editor-accept-confirm-ok
			// Transition editor dialog is currently open, user edits transition type properties, 
			// presses the Accept button in the editor dialog, and finally clicks OK to confirm changes
			Logger.info("Transition editor: Accept - confirm OK");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.overlayId, 
					JSON.stringify(this.modelJSON.iconTabs), 
					this.connection.connectionId, 
					"transition-editor-accept-confirm-ok"
				)
			);

			GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.editTransition"));
    	}
		// CASE: User cancels by clicking "Cancel" on the "Accept" dialog
		else if (oEvent == sap.m.MessageBox.Action.CANCEL) {
			
			// Log TRANSITION event: transition-editor-accept-confirm-cancel
			// Transition editor dialog is currently open, user edits transition type properties, 
			// presses the Accept button in the editor dialog, and finally clicks Cancel to cancel confirmation
			Logger.info("Transition editor: Accept - confirm Cancel");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.overlayId, 
					JSON.stringify(this.modelJSON.iconTabs), 
					this.connection.connectionId, 
					"transition-editor-accept-confirm-cancel"
				)
			);

		}
    }
	
	/**
	 * Called when the transition editor dialog Cancel button is clicked
	 */
	closeDialog() {
		this.modelJSON = JSON.parse(JSON.stringify(this.oldModelJSON));
		this.model.setData(this.modelJSON);
		this.scopeMask = this.oldScopeMask;
		this.dialog.close();
		this.dialog.destroy();

		// Log TRANSITION event: transition-editor-cancel
		// Transition editor dialog is currently open, then the Cancel button in the editor dialog is pressed
		Logger.info("Transition editor: Cancel");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createTransitionPayloadFull(
				MetricsHelper.LogEventType.TRANSITION, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.overlayId, 
				JSON.stringify(this.modelJSON.iconTabs), 
				this.connection.connectionId, 
				"transition-editor-cancel"
			)
		);
	}
	
	remove() {
		
		//Open a dialog so the user can confirm the delete
		sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.remove"), {onClose : $.proxy(this.removeTransition, this)});
	}
	
	removeTransition(oAction) {
		
		//If they click OK, delete
		// CASE: User attempts to remove a transition -> confirmation box displayed -> user confirms "OK"
		if(oAction == sap.m.MessageBox.Action.OK) {
			
			//Remove the overlay
			this.jsPlumbConnection.removeOverlay(this.overlayId);
			
			//Remove it from the list
			GameEditor.getEditorController().transitionList.splice(GameEditor.getEditorController().transitionList.indexOf(this), 1);
			
			//Remove the connections pointer to us
			this.connection.transition = null;
			
	    	//Revalidate the transitions
	    	for(var i = 0; i < GameEditor.getEditorController().transitionList.length; i++) {
				GameEditor.getEditorController().transitionList[i].onChange();
	    	}
	    	
	    	//Revalidate the states
	    	for(var i = 0; i < GameEditor.getEditorController().stateList.length; i++) {
	    		if(!GameEditor.getEditorController().stateList[i].htmlId.includes("start")) {
					GameEditor.getEditorController().stateList[i].onChange();
	    		}
	    	}
			
			// Log TRANSITION event: transition-remove-confirm
			// Transition is removed after triggering then confirming the confirmation dialog
			Logger.info("Transition removal: confirmed");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId,
					this.overlayId, 
					JSON.stringify(this.modelJSON.iconTabs), 
					this.connection.connectionId, 
					"transition-remove-confirm"
				)
			);

			GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.deleteTransition"));
		}
		// CASE: User attempts to remove a transition -> confirmation box displayed -> user cancels "Cancel"
		else if(oAction == sap.m.MessageBox.Action.CANCEL) {

			// Log TRANSITION event: transition-remove-cancel
			// Transition removal is canceled after triggering then canceling the confirmation dialog
			Logger.info("Transition removal: canceled");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createTransitionPayloadFull(
					MetricsHelper.LogEventType.TRANSITION, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId,
					this.overlayId, 
					JSON.stringify(this.modelJSON.iconTabs), 
					this.connection.connectionId, 
					"transition-remove-cancel"
				)
			);
			
		}
	}
	
	getActiveScopes() {
		var activeScopes = [];
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			var tempActiveScopes = this.transitionConfigs[i].getActiveScopes();
			for(var n = 0; n < tempActiveScopes.length; n++) {
				if(activeScopes.indexOf(tempActiveScopes[n]) == -1) {
					activeScopes.push(tempActiveScopes[n]);
				}
			}
		}
		return activeScopes;
	}
	
	getFullyActiveScopes(neighborTransitions) {
		var activeScopes = [];
		for(var i = 0; i < this.transitionConfigs.length; i++) {
			var tempActiveScopes = this.transitionConfigs[i].getFullyActiveScopes(neighborTransitions);
			for(var n = 0; n < tempActiveScopes.length; n++) {
				if(activeScopes.indexOf(tempActiveScopes[n]) == -1) {
					activeScopes.push(tempActiveScopes[n]);
				}
			}
		}
		return activeScopes;
	}
}