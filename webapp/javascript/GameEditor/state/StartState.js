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
			}}}, this.outputEndPoint);
		
		//Setup double click
		$("#"+this.stateDiv.id).dblclick($.proxy(this.explainWindow, this));
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
}