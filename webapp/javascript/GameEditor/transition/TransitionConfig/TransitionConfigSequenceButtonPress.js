var TransitionConfigSequenceButtonPress = class TransitionConfigSequenceButtonPress extends TransitionConfig {
	
	constructor(transition) {
		super(transition);
		this.validationRules.push(new SingleButtonPressValidationRule());
	}
	
	getNavigationListItem() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress"),
			type : TransitionConfigType.SEQUENCE_BUTTON_PRESS,
			icon : "sap-icon://multiselect-none",
			selected : false,
			visible : true
		}
	}
	
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress"),
			type : TransitionConfigType.SEQUENCE_BUTTON_PRESS,
			sequencePress : []
		}
	}
	
	getTransitionConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransitionSequenceButtonPressConfig", this);
	}
	
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
					if(iconTabs[i].navigationContainerPages[n].sequencePress.length > 0) {
						activeScopes.push(iconTabs[i].scope);
					}
				}
			}
		}
		return activeScopes;
	}
	
	getFullyActiveScopes(neighborTransitions) {
		var scopeCollection = [];
		var activeScopes = [];
		return activeScopes;
	}
	
	setLoadData(loadData) {
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var key in loadData.sequenceButtonPresses) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
							for(var k = 0; k < loadData.sequenceButtonPresses[key].sequences.length; k++) {
								var buttons = [];
								for(var j = 0; j < loadData.sequenceButtonPresses[key].sequences[k].length; j++) {
									buttons.push({number : parseInt(loadData.sequenceButtonPresses[key].sequences[k].charAt(j))});
								}
								iconTabs[i].navigationContainerPages[n].sequencePress.push({buttons: buttons});
							}
						}
					}
				}
			}
		}
	}
	
	getSaveData() {
		var sequenceButtonPresses = {};
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
					var sequences = [];
					for(var k = 0; k < iconTabs[i].navigationContainerPages[n].sequencePress.length; k++) {
						var buttons = "";
						for(var j = 0; j < iconTabs[i].navigationContainerPages[n].sequencePress[k].buttons.length; j++) {
							buttons = buttons.concat(iconTabs[i].navigationContainerPages[n].sequencePress[k].buttons[j].number);
						}
						sequences.push(buttons);
					}
					if(sequences.length > 0) {
						sequenceButtonPresses[iconTabs[i].scope] = {
							sequenceButtonPressId : this.transition.overlayId + "_" + iconTabs[i].scope.toLowerCase().replace(" ", "_"),
							transition : this.transition.overlayId,
							scope : iconTabs[i].scope,
							sequences : sequences
						}
					}
				}
			}
		}
		return {
			sequenceButtonPresses : sequenceButtonPresses
		};
	}
	
	onAfterRenderingDialog() {
		this.sequenceRefresh();
	}

	onAfterOpen(oEvent) {
		var iconTabs = this.transition.dialog.getContent()[0].getItems();
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].getContent()[0].getContentAreas()[1].getPages().length; n++) {
				if(this.transition.model.getProperty(iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getBindingContext().getPath()).type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
					var sequencePress = this.transition.model.getProperty(iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getBindingContext().getPath()).sequencePress;
					if(sequencePress.length == 1) {
						if(sequencePress[0].buttons.length === 0) {
							iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getContent()[0].getItems()[0].setVisible(false);
							iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getContent()[0].getItems()[1].setSelected(true);
							iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getContent()[1].setVisible(false);
						} else {
							iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getContent()[0].getItems()[1].setVisible(false);
						}
					} else if(sequencePress.length != 0) {
						iconTabs[i].getContent()[0].getContentAreas()[1].getPages()[n].getContent()[0].getItems()[1].setVisible(false);
					}
				}
			}
		}
	}
	
	closeDialog() {
		this.dialog.close();
		this.dialog.destroy();
	}
	
	addSequence(oEvent) {
		//Create an instance of the dialog
		this.dialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.SequenceButtonPress", this);
		
		//Set the model for the dialog
		this.dialog.setModel(new sap.ui.model.json.JSONModel({sequence : [{}]}));
		
		//Set the on after rendering
		this.dialog.onAfterRendering = $.proxy(this.onAfterRenderingSequence, this);
			
		//Open the dialog
		this.dialog.open();
		
		//Store the scopes path
		this.navigationContainerPagePath = oEvent.getSource().getParent().getParent().getContent()[1].getBindingContext().getPath();
		this.iconTabPath = oEvent.getSource().getParent().getParent().getParent().getBindingContext().getPath();

		//Store the original height of the input box
		this.inputBoxHeight = parseInt(getComputedStyle(document.querySelector(".sequencePressColorList")).height.replace("px", ""));

		this.selectAllOther = oEvent.getSource().getParent().getItems()[1];
	}
	
	acceptSequence() {
		var sequence = $("#colorListSortable-listUl").sortable("toArray", { attribute: "class" });
		var data = this.transition.model.getProperty(this.navigationContainerPagePath + "/sequencePress");
		var buttonsArray = [];
		for(var i = 0; i < sequence.length; i++) {
			if(sequence[i].includes("Red")) {
				buttonsArray.push({number : 1});
			} else if(sequence[i].includes("Green")) {
				buttonsArray.push({number : 2});
			} else if(sequence[i].includes("Blue")) {
				buttonsArray.push({number : 3});
			} else if(sequence[i].includes("Black")) {
				buttonsArray.push({number : 4});
			}
		}
		if(buttonsArray.length == 0) {
			sap.m.MessageBox.information(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress.emptyInput"));
		}
		var sequenceValidation = new TransitionSequenceButtonPressValidationRule();
		if(!sequenceValidation.validate(this.transition, {buttons : buttonsArray}, this.transition.model.getProperty(this.iconTabPath).scope)) {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress.alreadyExists"));
		} else {
			data.push({buttons : buttonsArray});
			this.transition.model.setProperty(this.navigationContainerPagePath + "/sequencePress", data);
			this.onChange();
			this.sequenceRefresh();
		}
		this.selectAllOther.setVisible(false);
		this.closeDialog();
	}
	
	deleteSequence(oEvent) {
		this.selectAllOther = oEvent.getSource().getParent().getParent().getParent().getParent().getContent()[0].getItems()[1];
		this.deletePath = oEvent.getSource().getBindingContext().getPath();
		this.deleteSequencePath = oEvent.getSource().getParent().getParent().getBindingContext().getPath() + "/sequencePress";
		sap.m.MessageBox.confirm(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress.remove"), {onClose : $.proxy(this.deleteOnClose, this)});
	}

	clearSequence(oEvent) {
		$("#colorListSortable-listUl").children().remove();
		document.getElementById("colorListSortable-listUl").style.height = this.inputBoxHeight.toString() + "px";
		$("#colorListSortable-listUl").sortable('refresh');
	}
	
	deleteOnClose(oEvent) {
		if(oEvent == "OK") {
			var splitPath = this.deletePath.split("/");
			var index = parseInt(splitPath[splitPath.length - 1]);
			var sequenceArray = this.transition.model.getProperty(this.deleteSequencePath);
			sequenceArray.splice(index, 1);
			this.transition.model.setProperty(this.deleteSequencePath, sequenceArray);
			this.onChange();
			this.sequenceRefresh();
			if(sequenceArray.length == 0) { this.selectAllOther.setVisible(true); }
		} 
	}
	
	onAfterRenderingSequence(oEvent) {
		$("#colorListRed").click(function() {
			$("#colorListRed").clone().appendTo($("#colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#colorListGreen").click(function() {
			$("#colorListGreen").clone().appendTo($("#colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#colorListBlue").click(function() {
			$("#colorListBlue").clone().appendTo($("#colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#colorListBlack").click(function() {
			$("#colorListBlack").clone().appendTo($("#colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#colorListSortable-listUl").sortable({
			disabled: true,
			update: function(event, ui) {
				var sequence = $("#colorListSortable-listUl").sortable("toArray", { attribute: "class" });
				if(sequence.length % 4 == 0) {
					var newHeight = document.getElementById("colorListSortable-listUl").clientHeight + this.inputBoxHeight;
					document.getElementById("colorListSortable-listUl").style.height = newHeight.toString() + "px";
				}
			}.bind(this)
		});
	}

	up() {
		var sequence = $("#colorListSortable-listUl").sortable("toArray", { attribute: "class" });
			if(sequence.length % 4 == 0) {
				var newHeight = document.getElementById("colorListSortable-listUl").clientHeight + this.inputBoxHeight;
				document.getElementById("colorListSortable-listUl").style.height = newHeight.toString() + "px";
			}
		$("#colorListSortable-listUl").sortable('refresh');
	}
	
	sequenceRefresh() {
		var tabs = sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems();
		for(var i = 0; i < tabs.length; i++) {
			var sequences = sap.ui.getCore().byId("outputStateDialog").getContent()[0].getItems()[i].getContent()[0].getContentAreas()[1].getPages()[1].getContent()[1].getItems()[0].getItems();
			for(var n = 0; n < sequences.length; n++) {
				var sequence = sequences[n].getContent()[0].getItems();
				for(var j = 0; j < sequence.length; j++) {
					var path = sequence[j].getBindingContext().getPath();
					var data = this.transition.model.getProperty(path);
					if(sequence[j].hasStyleClass("sequenceButton")) {
						var stylesToRemove = [];
						for(var k = 0; k < sequence[j].aCustomStyleClasses.length; k++) {
							stylesToRemove.push(sequence[j].aCustomStyleClasses[k]);
						}
						for(var k = 0; k < stylesToRemove.length; k++) {
							sequence[j].removeStyleClass(stylesToRemove[k]);
						}
					}
					switch(data.number) {
					case 1:
						sequence[j].addStyleClass("sequenceButton sequenceButtonRed");
						break;
					case 2:
						sequence[j].addStyleClass("sequenceButton sequenceButtonGreen");
						break;
					case 3:
						sequence[j].addStyleClass("sequenceButton sequenceButtonBlue");
						break;
					case 4:
						sequence[j].addStyleClass("sequenceButton sequenceButtonBlack");
						break;
					default:
						break;
					}
				}
			}
		}
	}

	selectAllOtherInputs(oEvent) {
		var data = this.transition.model.getProperty(oEvent.getSource().getBindingContext().getPath() + "/sequencePress");
		if(oEvent.getSource().getSelected()) {
			var sequenceValidation = new TransitionSequenceButtonPressValidationRule();
			if(!sequenceValidation.validate(this.transition, {buttons : []}, this.transition.model.getProperty(oEvent.getSource().getParent().getParent().getParent().getBindingContext().getPath()).scope)) {
				sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress.alreadyExists"));
				oEvent.getSource().getParent().getItems()[1].setSelected(false);
			} else {
				oEvent.getSource().getParent().getItems()[0].setVisible(false);
				oEvent.getSource().getParent().getParent().getContent()[1].getItems()[0].setVisible(false);
				data.push({buttons : []});
				this.transition.model.setProperty(oEvent.getSource().getBindingContext().getPath() + "/sequencePress", data);
			}
		} else {
			oEvent.getSource().getParent().getItems()[0].setVisible(true);
			oEvent.getSource().getParent().getParent().getContent()[1].getItems()[0].setVisible(true);
			this.transition.model.setProperty(oEvent.getSource().getBindingContext().getPath() + "/sequencePress", []);
		}
		this.onChange();
	}
}

var TransitionSequenceButtonPressValidationRule = class TransitionSequenceButtonPressValidationRule extends ValidationRule {
	
	validate(transition, sequence, scope) {
		
		var transitionList = [];
		
		//Get a list of neighbor connections
		var neighborConnections = GameEditor.getJsPlumbInstance().getConnections({source : transition.connection.connectionFrom.htmlId});
		
		//Loop through the neighbor connections
		for(var i = 0; i < neighborConnections.length; i++) {
			for(var n = 0; n < GameEditor.getEditorController().transitionList.length; n++) {
				if(neighborConnections[i].id == GameEditor.getEditorController().transitionList[n].connection.connectionId) {
					transitionList.push(GameEditor.getEditorController().transitionList[n]);
				}
			}
		}
		
		//Loop through the transition list
		for(var i = 0; i < transitionList.length; i++) {
			for(var n = 0; n < transitionList[i].modelJSON.iconTabs.length; n++) {
				if(scope == transitionList[i].modelJSON.iconTabs[n].scope) {
					for(var j = 0; j < transitionList[i].modelJSON.iconTabs[n].navigationContainerPages.length; j++) {
						if(transitionList[i].modelJSON.iconTabs[n].navigationContainerPages[j].type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
							if(this.containsSequence(sequence, transitionList[i].modelJSON.iconTabs[n].navigationContainerPages[j].sequencePress)) {
								return false;
							}
						}
					}
				}
			}
		}
		
		return true;	
	}
	
	containsSequence(sequence, sequences) {
		for(var i = 0; i < sequences.length; i++) {
			if(sequences[i].buttons.length == sequence.buttons.length) {
				var equal = true;
				for(var n = 0; n < sequence.buttons.length; n++) {
					if(sequences[i].buttons[n].number != sequence.buttons[n].number) {
						equal = false;
						break;
					}
				}
				if(equal) {
					return true;
				}
			}
		}
		return false;
	}
}