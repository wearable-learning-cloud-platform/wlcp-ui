var StartState = class StartState extends State {
	
	constructor(topColorClass, bottomColorClass, text, htmlId, jsPlumbInstance) {
		super(topColorClass, bottomColorClass, text, htmlId, jsPlumbInstance);
		this.outputEndPoint = {
				 endpoint:"Dot",
				 isTarget:true,
				 isSource:true,
				 maxConnections: -1,
			};
		this.stateType = "START_STATE";
		this.stateConfigs = [];
		this.setupStateConfigs();
		this.model = new sap.ui.model.json.JSONModel(this.createData());
		this.oldModelJSON = {};
		this.create();
	}
	
	create() {
		
		//Call the super method
		super.create();
		
		//Setup the end points
		this.jsPlumbInstance.addEndpoint(this.stateDiv.id, { id : this.htmlId + "output", anchor:"Bottom", paintStyle:{ fill: "#5E696E" }, dragOptions: {
			drag: function(event) { 
				GameEditor.getEditorController().scroller.leftMouseDown = true;
				GameEditor.getEditorController().scroller.handleMousemove(event.e);
			},
			stop: function(event) {
				GameEditor.getEditorController().scroller.leftMouseDown = false;
				GameEditor.getEditorController().scroller.handleMousemove(event.e);
			}}}, this.outputEndPoint);
		
		//Setup double click
		$("#"+this.stateDiv.id).dblclick($.proxy(this.doubleClick, this));
	}

	doubleClick() {
		//Create an instance of the dialog
		this.dialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.StartStateConfig", this);

		//Set the model for the dialog
		this.dialog.setModel(this.model);

		for(var n = 0; n < sap.ui.getCore().byId("navContainer").getPages().length; n++) {
			var iconTabBarPage = sap.ui.getCore().byId("navContainer").getPages()[n];
			if(iconTabBarPage.getContent().length == 0) {
				this.stateConfigs[n].getStateConfigFragment().forEach(function (oElement) {iconTabBarPage.addContent(oElement);});
			}
			iconTabBarPage.setTitle(this.stateConfigs[n].getNavigationContainerPage().title);
		}

		//Set the old scope mask
		this.oldModelJSON = JSON.parse(JSON.stringify(this.model.getData()));

		//Open the dialog
		this.dialog.open();

		// Log STATE event: start-state-editor-dialog-open-success
		// User attempts to open the Start State editor dialog by double-clicking and is successful
		Logger.info("Start State editor: dialog opened");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.START_STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.htmlId, 
				JSON.stringify(this.model.getData()),
				"start-state-editor-dialog-open-success"
			)
		);
	}

	setupStateConfigs() {
		this.stateConfigs.push(new StartStateConfigGlobalVariables(this));
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
			navigationListItems : tempNavigationListItems,
			navigationContainerPages : tempNavigationContainerPages,
		}
	}
	
	static load(loadData) {
		//Create a new start state
		var startState = new StartState("startStateTopColor", "startStateBottomColor", sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.startState") , loadData.stateId, GameEditor.getEditorController().jsPlumbInstance);
		
		//Set the position
		startState.setPositionX(loadData.positionX); startState.setPositionY(loadData.positionY);
		
		//Redraw it
		startState.draw();
		
		//Push back the state
		GameEditor.getEditorController().stateList.push(startState);

		//Load the states components
		startState.loadComponents(loadData);
	}

	loadComponents(loadData) {
		for(var i = 0; i < this.stateConfigs.length; i++) {
			this.stateConfigs[i].setLoadData(loadData);
		}
	}
	
	save() {
		var tempOutputConnections = [];
		for(var i = 0; i < this.outputConnections.length; i++) {
			tempOutputConnections.push(this.outputConnections[i].connectionId);
		}
		var saveData = {
			stateId : this.htmlId,
			game : GameEditor.getEditorController().gameModel.gameId,
			positionX : this.positionX,
			positionY : this.positionY,
			stateType : "START_STATE",
			inputConnections : [],
			outputConnections : tempOutputConnections
		}
		for(var i = 0; i < this.stateConfigs.length; i++) {
			var data = this.stateConfigs[i].getSaveData();
			for(var key in data) {
				saveData[key] = data[key];
			}
		}
		return saveData;
	}
	
	onChange(oEvent) {
		
	}
	
	getActiveScopes() {
		return ["Game Wide"];
	}
	
	explainWindow(){
		sap.m.MessageBox.information(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.state.startExplain"));
		return;
	}

	acceptDialog() {
		GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.editStartState"));
		this.dialog.close();
		this.dialog.destroy();
		// Log STATE event: start-state-editor-accept-withchanges
		// User attempts to accept the Start State editor dialog
		Logger.info("Start State editor: dialog accept");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.START_STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.htmlId, 
				JSON.stringify(this.model.getData()),
				"start-state-editor-accept-withchanges"
			)
		);
    }

	closeDialog() {
		this.modelJSON = JSON.parse(JSON.stringify(this.oldModelJSON));
		this.model.setData(this.modelJSON);
		this.dialog.close();
		this.dialog.destroy();
		// Log STATE event: start-state-editor-cancel
		// User attempts to cancel the Start State editor dialog
		Logger.info("Start State editor: dialog cancel");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createStatePayloadFull(
				MetricsHelper.LogEventType.START_STATE, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().gameModel.gameId, 
				this.htmlId, 
				JSON.stringify(this.model.getData()),
				"start-state-editor-cancel"
			)
		);
	}
}