var TransitionConfig = class TransitionConfig {

	constructor(transition) {
		this.transition = transition;
		this.validationRules = [];
		this.validationRules.push(new TransitionSelectedTypeValidationRule());
	}
	
	onChange(oEvent) {
		this.transition.onChange(oEvent, false);
		this.validationRules[0].validate(this.transition, false);
	}
	
	getNavigationListItem() {
		return {
			title : "",
			type : "",
			icon : ""
		}
	}
	
	getNavigationContainerPage() {
		return {
			title : "",
			type : ""
		}
	}
	
	getTransitionConfigFragment() {
		return null;
	}
	
	getActiveScopes() {
		return [];
	}
	
	getFullyActiveScopes(neighborTransitions) {
		return [];
	}
	
	setLoadData(loadData) {
		
	}
	
	getSaveData() {
		return {};
	}
	
	onAfterRenderingDialog() {
		
	}
	
	onAfterOpen() {
		
	}
	
}

var TransitionSelectedTypeValidationRule = class TransitionSelectedTypeValidationRule extends ValidationRule {
	
	validate(transition, updateNeighborTransitions = true) {

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

		// 1. Nothing active across all transitions show all
		// 2. One active show only active + secondary (in ones not active)
		// 3. Two active only show on one thats active
		
		//Loop through the transition list
		for(var i = 0; i < transitionList.length; i++) {
			if(!updateNeighborTransitions) {
				if(transitionList[i].overlayId !== transition.overlayId) {
					continue;
				}
			}
			var scopes = transitionList[i].modelJSON.iconTabs;
			for(var n = 0; n < scopes.length; n++) {
				var activeTransitionTypesAcrossAll = this.getActiveTransitionTypeAcrossAll(transitionList, scopes[n].scope);
				var activeTransitionTypeNonSecondary = this.getActiveTransitionTypeNonSecondary(transitionList, scopes[n].scope);
				var activeTransitionType = this.getActiveTransitionType(transitionList[i], scopes[n].scope);
				if(activeTransitionTypesAcrossAll.length == 1 && activeTransitionTypesAcrossAll.includes("")) {
					var transitionTypes = transitionList[i].modelJSON.iconTabs[n].navigationListItems;
					if(scopes[n].scope == transitionList[i].modelJSON.iconTabs[n].scope) {
						for(var j = 0; j < transitionTypes.length; j++) {
							transitionTypes[j].visible = true;
						}
					}
				} else if (activeTransitionTypesAcrossAll.length >= 1 && !activeTransitionTypesAcrossAll.includes("")) {
					var transitionTypes = transitionList[i].modelJSON.iconTabs[n].navigationListItems;
					if(scopes[n].scope == transitionList[i].modelJSON.iconTabs[n].scope) {
						for(var j = 0; j < transitionTypes.length; j++) {
							if(activeTransitionType === "") {
								if(transitionTypes[j].type == activeTransitionTypeNonSecondary || this.checkForAllowedSecondaryTransition(transitionTypes[j].type, activeTransitionTypesAcrossAll)) {
									transitionTypes[j].visible = true;
								} else {
									transitionTypes[j].visible = false;
								}
							} else {
								if(transitionTypes[j].type == activeTransitionType) {
									transitionTypes[j].visible = true;
									transitionList[i].modelJSON.iconTabs[n].activeTransition = transitionTypes[j].title;
								} else {
									transitionTypes[j].visible = false;
								}
							}
						}
					}
				} 
			}
			transitionList[i].model.setData(transitionList[i].modelJSON);
		}
	}

	checkForAllowedSecondaryTransition(transitionType, activeTransitionTypesAcrossAll) {
		if(transitionType === TransitionConfigType.TIMER) {
			if(activeTransitionTypesAcrossAll.includes(TransitionConfigType.RANDOM)) {
				return false;
			}
			if(!activeTransitionTypesAcrossAll.includes(TransitionConfigType.TIMER)) {
				return true;
			}
		}
		return false;
	}

	getActiveTransitionTypeAcrossAll(transitionList, scope) {
		var activeList = [];
		for(var i = 0; i < transitionList.length; i++) {
			for(var n = 0; n < transitionList[i].modelJSON.iconTabs.length; n++) {
				if(scope == transitionList[i].modelJSON.iconTabs[n].scope) {
					var activeTransitionType = this.getActiveTransitionType(transitionList[i], scope)
					if(!activeList.includes(activeTransitionType)) {
						activeList.push(activeTransitionType);
					}
				}
			}
		}
		if(activeList.length > 1 && activeList.includes("")) {
			activeList.splice(activeList.indexOf(""), 1);
		}
		return activeList;
	}

	getActiveTransitionTypeNonSecondary(transitionList, scope) {
		var activeTransitionTypesAcrossAll = this.getActiveTransitionTypeAcrossAll(transitionList, scope);
		if(activeTransitionTypesAcrossAll.length == 0) {
			return "";
		} else if(activeTransitionTypesAcrossAll.length == 1) {
			return activeTransitionTypesAcrossAll[0];
		} else if(activeTransitionTypesAcrossAll.length == 2) {
			if(activeTransitionTypesAcrossAll.includes(TransitionConfigType.TIMER)) {
				activeTransitionTypesAcrossAll.splice(activeTransitionTypesAcrossAll.indexOf(TransitionConfigType.TIMER), 1);
			}
			return activeTransitionTypesAcrossAll;
		}
	}

	getActiveTransitionType(transition, scope) {
		var iconTabs = transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == scope) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.SINGLE_BUTTON_PRESS) {
						if(iconTabs[i].navigationContainerPages[n].singlePress[0].selected || iconTabs[i].navigationContainerPages[n].singlePress[1].selected || 
							iconTabs[i].navigationContainerPages[n].singlePress[2].selected || iconTabs[i].navigationContainerPages[n].singlePress[3].selected) {
							return TransitionConfigType.SINGLE_BUTTON_PRESS;
						}
					} else if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.SEQUENCE_BUTTON_PRESS) {
						if(iconTabs[i].navigationContainerPages[n].sequencePress.length > 0) { 
							return TransitionConfigType.SEQUENCE_BUTTON_PRESS;
						}
					} else if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.KEYBOARD_INPUT) {
						if(iconTabs[i].navigationContainerPages[n].keyboardField.length > 0) {
							return TransitionConfigType.KEYBOARD_INPUT;
						}
					} else if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.TIMER) {
						if(iconTabs[i].navigationContainerPages[n].duration > 0) {
							return TransitionConfigType.TIMER;
						}
					} else if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.RANDOM) {
						if(iconTabs[i].navigationContainerPages[n].randomEnabled == true) {
							return TransitionConfigType.RANDOM;
						}
					} else if(iconTabs[i].navigationContainerPages[n].type == TransitionConfigType.GLOBAL_VARIABLE) {
						if(iconTabs[i].navigationContainerPages[n].items.length > 0) {
							return TransitionConfigType.GLOBAL_VARIABLE;
						}
					}
				}
			}
		}
		return "";
	}
}