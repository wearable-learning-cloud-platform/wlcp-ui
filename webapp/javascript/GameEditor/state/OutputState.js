var OutputState = class OutputState extends State {
	
	constructor(topColorClass, bottomColorClass, text, htmlId, jsPlumbInstance) {

		super(topColorClass, bottomColorClass, text, htmlId, jsPlumbInstance);
		
		this.modelJSON = {
				description : this.text,
				iconTabs : []
		}
		
		this.oldModelJSON = {};
		this.stateConfigs = [];
		this.setupStateConfigs();
		
		/* 
		- Each iconTabs element corresponds to a tracked item/object
		within a state -> Game Wide, Team 1, Team 2, Team 1 Player 1, Team 1 Player 2, etc.
		- Each iconTabs element has properties -> scope, navigationContainerPages, etc.
		- The navigationContainerPages has all the elements editable by 
		a player -> Display Text, Display Photo, etc.
		*/
		this.modelJSON.iconTabs = this.generateData(
			GameEditor.getEditorController().gameModel.teamCount, 
			GameEditor.getEditorController().gameModel.playersPerTeam
		);
		
		this.model = new sap.ui.model.json.JSONModel(this.modelJSON);
		this.create();
		this.validationRules = [];
		this.setupValidationRules();
		this.scopeMask = 0xffffffff;
		this.oldActiveScopes = [];
		this.stateType = "OUTPUT_STATE";
	}
	
	create() {
		
		//Call the super method
		super.create();
		
		//Define the input end point style
		this.inputEndPoint = {
				 endpoint:"Dot",
				 isTarget:true,
				 isSource:false,
				 maxConnections: -1
		};
		
		//Define the output end point style
		this.outputEndPoint = {
				 endpoint:"Dot",
				 isTarget:true,
				 isSource:true,
				 maxConnections: -1,
		};
		
		//Setup the end points
		this.jsPlumbInstance.addEndpoint(this.stateDiv.id, { id : this.htmlId + "input", anchor:"Top", paintStyle:{ fill: "#5E696E" } }, this.inputEndPoint);
		this.jsPlumbInstance.addEndpoint(this.stateDiv.id, { id : this.htmlId + "output", anchor:"Bottom", paintStyle:{ fill: "#5E696E" }, dragOptions: {
			drag: function(event) { 
				GameEditor.getEditorController().scroller.leftMouseDown = true;
				GameEditor.getEditorController().scroller.handleMousemove(event.e);
			}}}, this.outputEndPoint);
		
		//Setup double click
		$("#"+this.stateDiv.id).dblclick($.proxy(this.doubleClick, this));
	}
	
	setupStateConfigs() {
		this.stateConfigs.push(new StateConfigDisplayText(this));
		this.stateConfigs.push(new StateConfigDisplayPhoto(this));
		this.stateConfigs.push(new StateConfigPlaySound(this));
		this.stateConfigs.push(new StateConfigPlayVideo(this));
	}
	
	setupValidationRules() {
		this.validationRules.push(new StateScopeValidationRule());
	}
	
	/**
	 * Called when the user double-clicks a state
	 * @returns 
	 */
	doubleClick() {
		
		//Check to see if we have a connection to us
		var hasConnection = this.inputConnections.length > 0;
		if(!hasConnection) {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.state.noConnections"));
			return;
		}
		
		//Check to make sure there is atleast one non empty previous state
		var oneFilled = false;
		for(var i = 0; i < this.inputConnections.length; i++) {
			if(this.inputConnections[i].connectionFrom.htmlId.includes("_start") || this.inputConnections[i].connectionFrom.getActiveScopes().length > 0) {
				oneFilled = true;
				break;
			}
		}
		
		if(!oneFilled) {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.state.emptyInputs"));
			return;
		}
		
		//check if neighbor states have filled all scopes
		if(this.scopeMask == 0){
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.state.filledScope"));
			return;
		}
		
		//Create an instance of the State editor dialog
		this.dialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStateConfig", this);
		
		//Set the model for the dialog
		this.dialog.setModel(this.model);

		//Setup the state config pages + models
		var iconTabBar = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems();
		for(var i = 0; i < iconTabBar.length; i++) {
			for(var n = 0; n < iconTabBar[i].getContent()[0].getContentAreas()[1].getPages().length; n++) {
				var iconTabBarPage = iconTabBar[i].getContent()[0].getContentAreas()[1].getPages()[n];
				if(iconTabBarPage.getContent().length == 0) {
					this.stateConfigs[n].getStateConfigFragment().forEach(function (oElement) {iconTabBarPage.addContent(oElement);});
				}
				iconTabBarPage.setTitle(iconTabBar[i].getProperty("text") + " " + this.stateConfigs[n].getNavigationContainerPage().title);
			}
		}

		//Set the on after rendering
		this.dialog.onAfterRendering = $.proxy(this.onAfterRenderingDialog, this);
		
		//Set the old scope mask
		this.oldModelJSON = JSON.parse(JSON.stringify(this.modelJSON));
		
		//Set the old active scopes
		this.oldActiveScopes = this.getActiveScopes();

		//Set the default active state type
		this.setDefaultActiveStateType();
		
		//Open the dialog
		this.dialog.open();

		// Log STATE event: state-editor-dialog-open-success
		// User attempts to open the State editor dialog by double-clicking and is successful
		Logger.info("State editor: dialog opened");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.htmlId, 
				JSON.stringify(this.modelJSON.iconTabs),
				"state-editor-dialog-open-success"
			)
		);

	}
	
	descriptionChanged(oEvent) {
		this.newDescriptionText = oEvent.getParameter("newValue");
	}
	
	createData() {
		var tempNavigationListItems = [];
		var tempNavigationContainerPages = [];
		for(var i = 0; i < this.stateConfigs.length; i++) {
			tempNavigationListItems.push(this.stateConfigs[i].getNavigationListItem());
			tempNavigationContainerPages.push(this.stateConfigs[i].getNavigationContainerPage());
		}
		return {
			icon : "",
			scope : "",
			scopeText : "",
			activeState : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayText"),
			navigationListItems : tempNavigationListItems,
			navigationContainerPages : tempNavigationContainerPages,
		}
	}
	
	/**
	 * Called to set the iconTabs object within a state
	 * @param {*} teams 
	 * @param {*} playersPerTeam 
	 * @returns 
	 */
	generateData(teams, playersPerTeam) {
		
		//Create a new object to store the data
		var baseData = [];

		//Add game wide
		var data = this.createData();
		data.icon = "sap-icon://globe";
		data.scope = "Game Wide";
		data.scopeText = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.gameWide");
		for(var i = 0; i < data.navigationContainerPages.length; i++) {
			data.navigationContainerPages[i].scope = data.scope;
		}
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
	
	validate() {
		this.onChange();
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
		
		if(typeof sap.ui.getCore().byId("outputStateDialogIconTabBar") !== "undefined") {
			var iconTabBar = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems();
			for(var i = 0; i < iconTabBar.length; i++) {
				for(var n = 0; n < iconTabBar[i].getContent()[0].getContentAreas()[1].getPages().length; n++) {
					var iconTabBarPage = iconTabBar[i].getContent()[0].getContentAreas()[1].getPages()[n];
					if(iconTabBarPage.getContent().length == 0) {
						this.stateConfigs[n].getStateConfigFragment().forEach(function (oElement) {iconTabBarPage.addContent(oElement);});
					}
					iconTabBarPage.setTitle(iconTabBar[i].getProperty("text") + " " + this.stateConfigs[n].getNavigationContainerPage().title);
				}
			}
		}
	}
	
    onChange(oEvent) {
    	for(var i = 0; i < this.validationRules.length; i++) {
    		this.validationRules[i].validate(this);
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
    }
    
    acceptDialog() {

		// CASE: State editor dialog is open, user edits state properties, then presses the Accept button
    	if(JSON.stringify(this.oldActiveScopes) != JSON.stringify(this.getActiveScopes())) {
    		sap.m.MessageBox.confirm(
				sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validationEngine"), 
				{
					title:sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.validation.title"), 
					onClose : $.proxy(this.acceptRevalidation, this)
				}
			);

			// Log STATE event: state-editor-accept-withchanges
			// State editor dialog is currently open, user edits state properties, 
			// then presses the Accept button in the editor dialog
			Logger.info("State editor: Accept with changes");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-editor-accept-withchanges"
				)
			);

    		return;
		}

		// CASE: State editor dialog is open, user does not edit state properties, then presses the Accept button
		if(this.getActiveScopes().length == 0 && this.newDescriptionText == null) {
			sap.m.MessageBox.confirm(
				sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.noChanges"), 
				{
					title:sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.noChanges.title"), 
					onClose : $.proxy(this.acceptWithoutAnyChanges, this)
				}
			);

			// Log STATE event: state-editor-accept-nochanges
			// State editor dialog is currently open, user does not edit state properties, 
			// then presses the Accept button in the editor dialog
			Logger.info("State editor: Accept no changes");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-editor-accept-nochanges"
				)
			);

    		return;
		}

		this.validationRules[0].validate(this, true, true);
		this.dialog.close();
		this.dialog.destroy();
		
		this.changeText();

		GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.editState"));
    }
    
	/**
	 * Called when the user clicks either the "OK" or "Cancel" buttons on the "Accept"
	 * confirmation dialog of a state editor, with changes to state properties
	 * @param {*} oEvent 
	 */
    acceptRevalidation(oEvent) {

		// CASE: User confirms by clicking "OK" on the "Accept" dialog
    	if(oEvent == sap.m.MessageBox.Action.OK) {
    		this.validationRules[0].validate(this, true, true);
    		this.dialog.close();
			this.dialog.destroy();
			this.changeText();

			// Log STATE event: state-editor-accept-withchanges-confirm
			// State editor dialog is currently open, user edits state properties, 
			// presses the Accept button in the editor dialog, and finally confirms the confirmation dialog
			Logger.info("State editor: Accept with changes - confirm");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-editor-accept-withchanges-confirm"
				)
			);

			GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.editState"));
    	}
		// CASE: User cancels by clicking "Cancel" on the "Accept" dialog
		else if (oEvent == sap.m.MessageBox.Action.CANCEL) {
			
			// Log STATE event: state-editor-accept-withchanges-cancel
			// State editor dialog is currently open, user edits state properties, 
			// presses the Accept button in the editor dialog, and finally cancels the confirmation dialog
			Logger.info("State editor: Accept with changes - cancel");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-editor-accept-withchanges-cancel"
				)
			);

		}

	}
	
	/**
	 * Called when the user clicks either the "OK" or "Cancel" buttons on the "Accept"
	 * confirmation dialog of a state editor, without making changes to state properties
	 * @param {*} oEvent 
	 */
	acceptWithoutAnyChanges(oEvent) {

		// CASE: User confirms by clicking "OK" on the "Accept" dialog
		if(oEvent == sap.m.MessageBox.Action.OK) {

			this.dialog.close();
			this.dialog.destroy();

			// Log STATE event: state-editor-accept-nochanges-confirm
			// State editor dialog is currently open, user does not edit state properties, 
			// presses the Accept button in the editor dialog, and finally confirms the confirmation dialog
			Logger.info("State editor: Accept no changes - confirm");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					//JSON.stringify(this.modelJSON.iconTabs[0].navigationContainerPages),
					//"test",
					"state-editor-accept-nochanges-confirm"
				)
			);

		}
		// CASE: User cancels by clicking "Cancel" on the "Accept" dialog
		else if (oEvent == sap.m.MessageBox.Action.CANCEL) {

			// Log STATE event: state-editor-accept-nochanges-cancel
			// State editor dialog is currently open, user does not edit state properties, 
			// presses the Accept button in the editor dialog, and finally cancels the confirmation dialog
			Logger.info("State editor: Accept no changes - cancel");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					//JSON.stringify(this.modelJSON.iconTabs[0].navigationContainerPages),
					//"test",
					"state-editor-accept-nochanges-cancel"
				)
			);

		}
	}
	
	/**
	 * Called when the state editor dialog Cancel button is clicked
	 */
	closeDialog() {

		// modelJSON is always current state
		// oldModelJSON is the initial data state before editing
		// LOG modelJSON here

		this.modelJSON = JSON.parse(JSON.stringify(this.oldModelJSON));
		this.model.setData(this.modelJSON);
		this.dialog.close();
		this.dialog.destroy();
		
		// Log STATE event: state-editor-cancel
		// State editor dialog is currently open, then the Cancel button in the editor dialog is pressed
		Logger.info("State editor: Cancel");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.htmlId, 
				JSON.stringify(this.modelJSON.iconTabs),
				"state-editor-cancel"
			)
		);

	}
	
	navigationSelected(oEvent) {
		this.model.setProperty(oEvent.getSource().getParent().getBindingContext().getPath() + "/activeState", oEvent.getParameters().item.mProperties.text);
		var key = oEvent.getParameter("item").getKey();
		var navContainer = oEvent.oSource.getParent().getParent().getContentAreas()[1];
		for(var i = 0; i < navContainer.getPages().length; i++) {
			if(navContainer.getPages()[i].getTitle().includes(key)) {
				navContainer.to(navContainer.getPages()[i]);
				break;
			}
		}
	}

	onAfterRenderingDialog() {
		for(var i = 0; i < sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems().length; i++) {
			var navContainer = sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems()[i].getContent()[0].getContentAreas()[1];
			var path = sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems()[i].getBindingContext().getPath() + "/activeState";
			var activeState = this.model.getProperty(path);
			sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems()[i].getContent()[0].getContentAreas()[0].setSelectedKey(activeState);
			for(var n = 0; n < navContainer.getPages().length; n++) {
				if(navContainer.getPages()[n].getTitle().includes(activeState)) {
					navContainer.to(navContainer.getPages()[n]);
					break;
				}
			}
		}
	}

	setDefaultActiveStateType() {
		var activeScopes = this.getActiveScopes();
		for(var i = 0; i < sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems().length; i++) {
			if(!activeScopes.includes(this.model.getProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems()[i].getBindingContext().getPath()).scope)) {
				var activeState = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayText");
				this.model.setProperty(sap.ui.getCore().byId("outputStateDialog").getContent()[1].getItems()[i].getBindingContext().getPath() + "/activeState", activeState);
			}
		}
	}
	
	static load(loadData) {
		//Create a new display state
		var outputState = new OutputState("toolboxOutputStateTopColor", "toolboxOutputStateBottomColor", loadData.description, loadData.stateId, GameEditor.getEditorController().jsPlumbInstance);
		
		//Set the position
		outputState.setPositionX(loadData.positionX); outputState.setPositionY(loadData.positionY);
		
		//Redraw it
		outputState.draw();
		
		//Push back the state
		GameEditor.getEditorController().stateList.push(outputState);
		
		//Load the states components
		outputState.loadComponents(loadData);
	}
	
	loadComponents(loadData) {
		for(var i = 0; i < this.stateConfigs.length; i++) {
			this.stateConfigs[i].setLoadData(loadData, this.modelJSON.iconTabs);
		}
	}
	
	save() {
		var tempInputConnections = [];
		for(var i = 0; i < this.inputConnections.length; i++) {
			tempInputConnections.push(this.inputConnections[i].connectionId);
		}
		
		var tempOutputConnections = [];
		for(var i = 0; i < this.outputConnections.length; i++) {
			tempOutputConnections.push(this.outputConnections[i].connectionId);
		}
		
		var saveData = {
			stateId : this.htmlId,
			game : GameEditor.getEditorController().gameModel.gameId,
			positionX : this.positionX - this.dx,
			positionY : this.positionY - this.dy,
			stateType : "OUTPUT_STATE",
			description : this.text,
			inputConnections : tempInputConnections,
			outputConnections : tempOutputConnections//,
		}
		
		for(var i = 0; i < this.stateConfigs.length; i++) {
			var data = this.stateConfigs[i].getSaveData();
			for(var key in data) {
				saveData[key] = data[key];
			}
		}
		
		return saveData;
	}
	
	getActiveScopes() {
		var activeScopes = [];
		for(var i = 0; i < this.stateConfigs.length; i++) {
			var tempActiveScopes = this.stateConfigs[i].getActiveScopes();
			for(var n = 0; n < tempActiveScopes.length; n++) {
				if(activeScopes.indexOf(tempActiveScopes[n]) == -1) {
					activeScopes.push(tempActiveScopes[n]);
				}
			}
		}
		return activeScopes;
	}
	
}