var StateType = {
		START_STATE : "START_STATE",
		OUTPUT_STATE : "OUTPUT_STATE"
}

var State = class State {
	
	constructor(topColorClass, bottomColorClass, text, htmlId, jsPlumbInstance) {
		this.topColorClass = topColorClass;
		this.bottomColorClass = bottomColorClass;
		this.text = text;
		this.newDescriptionText = null;
		this.positionX = 0;
		this.positionY = 0;
		this.dx = 0;
		this.dy = 0;
		this.width = 0;
		this.height = 0;
		this.jsPlumbInstance = jsPlumbInstance;
		this.htmlId = htmlId;
		this.stateDiv = null;
		this.inputConnections = [];
		this.outputConnections = [];
	}
	
	static absoluteToRelativeX(absoluteX, width) {
		return absoluteX - (document.getElementById("container-wlcp-ui---gameEditor--toolbox").getBoundingClientRect().width + document.getElementById("container-wlcp-ui---gameEditor--mainSplitter-splitbar-0").getBoundingClientRect().width + (width / 2));
	};
	
	static absoluteToRelativeY(absoluteY) {
		return absoluteY - document.getElementById("container-wlcp-ui---gameEditor--padPage").firstElementChild.clientHeight;// + document.getElementById("container-wlcp-ui---gameEditor--toolbox-scroll").offsetHeight - 18;
	};
	
	create() {
		//Main div
		this.stateDiv = document.createElement('div');
		this.stateDiv.id = this.htmlId;
		if(!this.stateDiv.id.includes("start")) {
			this.stateDiv.className = "state stateBorderShadow jtk-drag-select";
		}
		else {
			this.stateDiv.className = "startState startStateBorderShadow jtk-drag-select";
		}
		
		
		//Top color
		var topColorDiv = document.createElement('div');
		topColorDiv.className = this.topColorClass;
		
		//Top Color Text
		var topColorText = document.createElement('div');
		topColorText.id = this.htmlId + "-description";
		topColorText.className = "centerStateText";
		topColorText.innerHTML = this.text;
		topColorDiv.appendChild(topColorText);
		
		if(!this.stateDiv.id.includes("start")) {
			//Delete Button
			var deleteButton = document.createElement('div');
			deleteButton.id = this.htmlId + "delete";
			deleteButton.className = "close-thik";
			topColorDiv.appendChild(deleteButton);	
		}
		
		//Bottom color
		var bottomColorDiv = document.createElement('div');
		bottomColorDiv.className = this.bottomColorClass;
		
		//Append
		this.stateDiv.appendChild(topColorDiv);
		this.stateDiv.appendChild(bottomColorDiv);
		
		//Add the div to the pad
		document.getElementById('container-wlcp-ui---gameEditor--pad').appendChild(this.stateDiv);
		
		//Get the width and height
		this.width = this.stateDiv.getBoundingClientRect().width;
		this.height = this.stateDiv.getBoundingClientRect().height;
		
		//Make it draggable
		this.jsPlumbInstance.draggable(this.stateDiv.id, {containment : true, drag : $.proxy(this.moved, this), stop : $.proxy(this.stopped, this)});
		
		// Mouse down event listener
		document.getElementById(this.stateDiv.id).addEventListener("mousedown", function(event) {
			GameEditor.getEditorController().scroller.leftMouseDown = true;
		}, false);
		
		// Mouse up event listener
		document.getElementById(this.stateDiv.id).addEventListener("mouseup", function(event) {
			GameEditor.getEditorController().scroller.leftMouseDown = false;
			GameEditor.getEditorController().scroller.handleMousemove(event);
		}, false);
		//$("#" + this.stateDiv.id).draggable({containment : "parent", stop : $.proxy(this.moved, this)});
		
		if(!this.stateDiv.id.includes("start")) {
			//Make delete clickable
			$("#" + deleteButton.id).click($.proxy(this.remove, this));
		}
	}
	
	remove() {
		
		//Open a dialog so the user can confirm the delete
		sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.state.remove"), {onClose : $.proxy(this.removeState, this)});
	}
	
	removeState(oAction) {
		
		//If they click OK, delete
		if(oAction == sap.m.MessageBox.Action.OK) {
			
			//Remove all connections
			for(var i = this.inputConnections.length - 1; i >= 0; i--) {
				this.inputConnections[i].detach();
			}
			for(var i = this.outputConnections.length - 1; i >= 0; i--) {
				this.outputConnections[i].detach();
			}
			
			//Remove the state element
			this.jsPlumbInstance.remove(this.htmlId);
			
			//Remove ourself from the connection list
			GameEditor.getEditorController().stateList.splice(GameEditor.getEditorController().stateList.indexOf(this), 1);
			
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
			
			// Log STATE event: state-remove-confirm
			// State is removed after triggering then confirming the confirmation dialog
			Logger.info("State removal: confirmed");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-remove-confirm"
				)
			);

			GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.deleteState"));
		}
		else if (oAction == sap.m.MessageBox.Action.CANCEL) {

			// Log STATE event: state-remove-cancel
			// State removal is canceled after triggering then canceling the confirmation dialog
			Logger.info("State removal: canceled");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-remove-cancel"
				)
			);
			
		}
	}
	
	draw() {

		//Set the start position
		document.getElementById(this.stateDiv.id).style.left = this.positionX + "px";
		document.getElementById(this.stateDiv.id).style.top = this.positionY + "px";
		
		//Repaint
		this.jsPlumbInstance.revalidate(this.stateDiv.id);
	}
	
	addPadSpace() {
		if(((this.positionX + this.width + 50) >= document.getElementById("container-wlcp-ui---gameEditor--pad").getBoundingClientRect().width + document.getElementById("container-wlcp-ui---gameEditor--pad").scrollLeft - 75) && (document.getElementById("container-wlcp-ui---gameEditor--pad").scrollLeft + document.getElementById("container-wlcp-ui---gameEditor--pad").clientWidth == document.getElementById("container-wlcp-ui---gameEditor--pad").scrollWidth)) {
			if(document.getElementById("scrollPlaceHolder").style.left === "0px") {
				document.getElementById("scrollPlaceHolder").style.left = document.getElementById("container-wlcp-ui---gameEditor--pad").getBoundingClientRect().width * 2 + "px";
			} else {
				document.getElementById("scrollPlaceHolder").style.left = document.getElementById("scrollPlaceHolder").offsetLeft + 500 + "px"
			}
			this.stateDiv._katavorioDrag.remark();
		}
		if(((this.positionY + this.height + 50) >= document.getElementById("container-wlcp-ui---gameEditor--pad").getBoundingClientRect().height + document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTop - 75) && (document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTop + document.getElementById("container-wlcp-ui---gameEditor--pad").clientHeight == document.getElementById("container-wlcp-ui---gameEditor--pad").scrollHeight)) {
			if(document.getElementById("scrollPlaceHolder").style.top === "0px") {
				document.getElementById("scrollPlaceHolder").style.top = document.getElementById("container-wlcp-ui---gameEditor--pad").getBoundingClientRect().height * 2 + "px";
			} else {
				document.getElementById("scrollPlaceHolder").style.top = document.getElementById("scrollPlaceHolder").offsetTop + 500 + "px";
			}
			this.stateDiv._katavorioDrag.remark();
		}
	}
	
	/**
	 * Called whenever a state is dragged to a different coordinate position
	 * NOTE: Not recommended for logging because every single coordinate movement will be logged
	 * @param {*} event 
	 */
	moved(event) {
		
		if(GameEditor.getEditorController().zoomLevel != 0) {
			var origin = GameEditorZoomHelpers.startStateAsOrigin();

			var pos = {
				x : parseInt(document.getElementById(this.htmlId).style.left.replace("px", "")),
				y : parseInt(document.getElementById(this.htmlId).style.top.replace("px", "")),
				dx : this.dx,
				dy : this.dy
			}

			var unroll = GameEditorZoomHelpers.calculateDiff(pos, origin, 0.25,  GameEditor.getEditorController().zoomLevel < 0 ? 1 : -1,  0, Math.abs(GameEditor.getEditorController().zoomLevel));
	
			var reroll = GameEditorZoomHelpers.calculateDiff({x : unroll.posX, y : unroll.posY}, origin, 0.25, GameEditor.getEditorController().zoomLevel < 0 ? -1 : 1, 0, Math.abs(GameEditor.getEditorController().zoomLevel));
			this.dx = reroll.totalDx;
			this.dy = reroll.totalDy;
			
			//Update the position
			this.positionX = reroll.posX;
			this.positionY = reroll.posY;
		} else {
			this.positionX = parseInt(document.getElementById(this.htmlId).style.left.replace("px", ""));
			this.positionY = parseInt(document.getElementById(this.htmlId).style.top.replace("px", ""));
			this.addPadSpace();
		}

		GameEditor.getEditorController().scroller.handleMousemove(this, event.e);
	}
	
	/**
	 * Called when a drag event on a state that has been initiated is stopped
	 */
	stopped() {

		// Check first what kind of state is being moved;
		// The start state does not have a modelJSON component
		if (this.stateType === StateType.START_STATE) {

			// Log STATE event: state-move
			// State moved to another part of the canvas
			Logger.info("State moved - start state");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					"start-state",
					"state-move"
				)
			);

		} 
		else if (this.stateType === StateType.OUTPUT_STATE) {

			// Log STATE event: state-move
			// State moved to another part of the canvas
			Logger.info("State moved - regular state");
			MetricsHelper.saveLogEvent(
				MetricsHelper.createStatePayloadFull(
					MetricsHelper.LogEventType.STATE, 
					MetricsHelper.LogContext.GAME_EDITOR, 
					GameEditor.getEditorController().gameModel.gameId, 
					this.htmlId, 
					JSON.stringify(this.modelJSON.iconTabs),
					"state-move"
				)
			);

		}

		GameEditor.getEditorController().scroller.leftMouseDown = false;
		GameEditor.getEditorController().scroller.handleMousemove(event.e);

		GameEditor.getEditorController().autoSave(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.autoSave.moveState"));
	}
	
	save() {
		return [];
	}
	
	changeText() {
		if(this.newDescriptionText !== null) {
			document.getElementById(this.htmlId + "-description").innerHTML = this.newDescriptionText;
			this.text = this.newDescriptionText;
			this.newDescriptionText = null;
		}
	}
	
	getPositionX() {
		return this.positionX;
	}
	
	getPositionY() {
		return this.positionY;
	}
	
	setPositionX(positionX) {
		this.positionX = parseFloat(positionX);
	}
	
	setPositionY(positionY) {
		this.positionY = parseFloat(positionY);
	}
	
	getHtmlId() {
		return this.htmlId;
	}
	
	static getStateById(stateId) {
		var stateList = GameEditor.getEditorController().stateList;
		for(var i = 0; i < GameEditor.getEditorController().stateList.length; i++) {
			if(stateList[i].htmlId == stateId) {
				return stateList[i];
			}
		}
	}
}