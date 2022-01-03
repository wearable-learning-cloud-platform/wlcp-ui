var TransitionConfigGlobalVariable = class TransitionConfigGlobalVariable extends TransitionConfig {

	constructor(transition) {
		super(transition);
	}

	getNavigationListItem() {
		return {
			title : "Global Variable", //sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.keyboardInput"),
			type : TransitionConfigType.GLOBAL_VARIABLE,
			icon : "sap-icon://globe",
			selected : false,
			visible : true
		}
	}

	getNavigationContainerPage() {
		return {
			title : "Global Variable",//sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.keyboardInput"),
			type : TransitionConfigType.GLOBAL_VARIABLE,
			items : []
		}
	}

	getTransitionConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransitionGlobalVariableConfig", this);
	}

	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].items.length > 0) {
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

    getGlobalVariables() {
        for(var i = 0; i < GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages.length; i++) {
			if(GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages[i].title === new StartStateConfigGlobalVariables().getNavigationContainerPage().title) {
                return GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages[i].items;
            }
        }
    }

    setGlobalVariables(oEvent) {
        var iconTabs = this.transition.modelJSON.iconTabs;
        for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                    var globalVariables = JSON.parse(JSON.stringify(this.getGlobalVariables()));
                    globalVariables.push({name : "expression"});
                    for(var k = 0; k < iconTabs[i].navigationContainerPages[n].items.length; k++) {
                        iconTabs[i].navigationContainerPages[n].items[k].globalVariables = globalVariables;
                        iconTabs[i].navigationContainerPages[n].items[k].count = this.getTableCount();
                        if(iconTabs[i].navigationContainerPages[n].items[k].count - 1 == k) {
                            iconTabs[i].navigationContainerPages[n].items[k].count = 0;
                        }
                    }
                    this.transition.model.refresh();
                    break;
                }
            }   
        }
    }

    getTableCount() {
        var iconTabs = this.transition.modelJSON.iconTabs;
        for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                    return iconTabs[i].navigationContainerPages[n].items.length;
                }
            }
        }
    }

    addGlobalVariable(oEvent) {
        var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
            if(iconTabs[i].scope === oEvent.getSource().getParent().getParent().getParent().getParent().getText()) {
                for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
                    if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                        iconTabs[i].navigationContainerPages[n].items.push({variableName : "", operator : "", value : "", logicalOperator : ""});
                        this.transition.model.refresh();
                        this.transition.onChange();
                        this.transition.onAfterRenderingDialog();
                        return;
                    }
                }
            }
        }
	}

	deleteGlobalVariable(oEvent) {
        var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
            if(iconTabs[i].scope === oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getText()) {
                for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
                    if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                        var indexToRemove = 0;
                        for(var k in iconTabs[i].navigationContainerPages[n].items) {
                            if(iconTabs[i].navigationContainerPages[n].items[k].expression === oEvent.getSource().getParent().getCells()[0].getValue()) {
                                indexToRemove = k;
                                break;
                            }
                        }
                        iconTabs[i].navigationContainerPages[n].items.splice(indexToRemove, 1);
                        this.transition.model.refresh();
                        this.transition.onChange();
                        this.transition.onAfterRenderingDialog();
                        return;
                    }
                }
            }
        }
	}

	setLoadData(loadData) {
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var key in loadData.globalVariables) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
							for(var k = 0; k < loadData.globalVariables[key].globalVariableInputModifiers.length; k++) {
                                iconTabs[i].navigationContainerPages[n].items.push({variableName : loadData.globalVariables[key].globalVariableInputModifiers[k].variableName, operator : loadData.globalVariables[key].globalVariableInputModifiers[k].operator, value : loadData.globalVariables[key].globalVariableInputModifiers[k].value, logicalOperator : loadData.globalVariables[key].globalVariableInputModifiers[k].logicalOperator});
							}
						}
					}
				}
			}
		}
	}

	getSaveData() {
		var globalVariables = {};
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                    var globalVariableInputModifiers = [];
                    for(var k = 0; k < iconTabs[i].navigationContainerPages[n].items.length; k++) {
                        globalVariableInputModifiers.push({variableName : iconTabs[i].navigationContainerPages[n].items[k].variableName, operator : iconTabs[i].navigationContainerPages[n].items[k].operator, value : iconTabs[i].navigationContainerPages[n].items[k].value, logicalOperator : iconTabs[i].navigationContainerPages[n].items[k].logicalOperator});
                    }
                    globalVariables[iconTabs[i].scope] = {
                        globalVariableId : this.transition.overlayId + "_" + iconTabs[i].scope.toLowerCase().replace(" ", "_"),
                        transition : this.transition.overlayId,
                        scope : iconTabs[i].scope,
                        globalVariableInputModifiers : globalVariableInputModifiers
                    }
				}
			}
		}
		return {
			globalVariables : globalVariables
		};
	}

	closeDialog() {
		this.dialog.close();
		this.dialog.destroy();
	}

} 