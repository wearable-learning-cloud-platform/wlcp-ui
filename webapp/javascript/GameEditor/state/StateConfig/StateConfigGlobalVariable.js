var StateConfigGlobalVariable = class StateConfigGlobalVariable extends StateConfig {

	constructor(state) {
        super(state);
	}

	getNavigationListItem() {
		return {
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.globalVariable"),
			icon : "sap-icon://globe"
		}
	}

	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.globalVariable"),
            items : []
		}
	}

	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStateGlobalVariableConfig", this);
	}

	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
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

    getGlobalVariables() {
        for(var i = 0; i < GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages.length; i++) {
			if(GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages[i].title === new StartStateConfigGlobalVariables().getNavigationContainerPage().title) {
                return GameEditor.getEditorController().stateList[0].model.getData().navigationContainerPages[i].items;
            }
        }
    }

    setGlobalVariables(oEvent) {
        var iconTabs = this.state.modelJSON.iconTabs;
        for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                    var globalVariables = JSON.parse(JSON.stringify(this.getGlobalVariables()));
                    globalVariables.push({name : "expression"});
                    for(var k = 0; k < iconTabs[i].navigationContainerPages[n].items.length; k++) {
                        iconTabs[i].navigationContainerPages[n].items[k].globalVariables = globalVariables;
                    }
                    this.state.model.refresh();
                    break;
                }
            }   
        }
    }

    addGlobalVariable(oEvent) {
        var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
            if(iconTabs[i].scope === oEvent.getSource().getParent().getParent().getParent().getParent().getText()) {
                for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
                    if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                        iconTabs[i].navigationContainerPages[n].items.push({variableName : "", operator : "", value : ""});
                        this.state.model.refresh();
                        return;
                    }
                }
            }
        }
	}

	deleteGlobalVariable(oEvent) {
        var iconTabs = this.state.modelJSON.iconTabs;
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
                        this.state.model.refresh();
                        return;
                    }
                }
            }
        }
	}

	setLoadData(loadData) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var key in loadData.globalVariables) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                            for(var k = 0; k < loadData.globalVariables[key].globalVariableOutputModifiers.length; k++) {
								iconTabs[i].navigationContainerPages[n].items.push({variableName : loadData.globalVariables[key].globalVariableOutputModifiers[k].variableName, operator : loadData.globalVariables[key].globalVariableOutputModifiers[k].operator, value : loadData.globalVariables[key].globalVariableOutputModifiers[k].value});
							}
						}
					}
				}
			}
		}
	}

	getSaveData() {
		var outputStateData = {};
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].items.length > 0) {
                        var globalVariableOutputModifiers = [];
                        for(var k = 0; k < iconTabs[i].navigationContainerPages[n].items.length; k++) {
                            globalVariableOutputModifiers.push({variableName : iconTabs[i].navigationContainerPages[n].items[k].variableName, operator : iconTabs[i].navigationContainerPages[n].items[k].operator, value : iconTabs[i].navigationContainerPages[n].items[k].value});
                        }
						outputStateData[iconTabs[i].scope] = {
                            globalVariableId : this.state.htmlId + "_" + iconTabs[i].scope.toLowerCase().replace(" ", "_"),
                            outputState : this.state.htmlId,
                            scope : iconTabs[i].scope,
                            globalVariableOutputModifiers : globalVariableOutputModifiers
                        }
					}
				}
			}
		}
		return {
			globalVariables : outputStateData
		};
	}
}