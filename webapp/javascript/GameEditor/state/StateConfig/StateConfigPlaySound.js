var StateConfigPlaySound = class StateConfigPlaySound extends StateConfig {
	
	constructor(state) {
		super(state);
		this.playSoundPage = null;
	}
	
	//side bar in configure window list of available states
	getNavigationListItem() {
		return {	
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playSound"),
			icon : "sap-icon://sound-loud"	
		}
	}
	
	//return title of page
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playSound"),
			url : "",
		}
    }

    urlUpdated(oEvent) {
        this.onChange(oEvent);
    }
    
    handleUploadPress() {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
						this.playSoundPage = i;
						break;
					}
				}
			}
		}

		if(typeof this.oFileUploader === "undefined") {
			this.oFileUploader = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems()[this.playSoundPage].getContent()[0].getContentAreas()[1].getPages()[2].getContent()[2].getItems()[0];
			this.oFileUploader.setUploadUrl(ServerConfig.getServerAddress() + "/objectStoreController/uploadFile");
			this.oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name : "Authorization",
				value : "Bearer " + SessionHelper.getCookie("wlcp.userSession")
			}));
			this.oFileUploader.setSendXHR(true);
		}
		var that = this;
		this.oFileUploader.checkFileReadable().then(function() {
			that.oFileUploader.upload();
		}, function(error) {
			MessageToast.show("Error reading file!");
		}).then(function() {
			that.oFileUploader.clear();
		});
	}

	handleUploadComplete(oEvent) {
		var sResponse = oEvent.getParameter("responseRaw");
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
						this.playSoundPage = iconTabs[i].navigationContainerPages[n];
						this.playSoundPage.url = ServerConfig.getServerAddress() + "/objectStoreController/files/" + sResponse;
                        this.state.model.setData(this.state.modelJSON);
                        this.urlUpdated(oEvent);
						break;
					}
				}
			}
		}
    }
    
    play(oEvent) {
		if(typeof this.sound !== "undefined") {
			if(!this.sound.paused && !this.sound.ended) {
				return;
			} else if(this.sound.paused || this.sound.ended) {
				this.sound.currentTime = 0;
				this.sound.play();
				return;
			}
		}
        var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
                        this.sound = new Audio(iconTabs[i].navigationContainerPages[n].url);
                        this.sound.play();
						break;
					}
				}
			}
		}
    }

    stop(oEvent) {
        this.sound.pause();
    }
	
	//put XML code here
	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStateConfigPlaySound", this);
	}
	
	//returns verified scopes Team 1, Player 2, Game Wide ect
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].url != "") {
						activeScopes.push(iconTabs[i].scope);
					}
				}
			}
		}
		return activeScopes;
	}
	
	//not sure, loading previous data maybe?
	setLoadData(loadData) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var key in loadData.soundOutputs) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
							iconTabs[i].navigationContainerPages[n].url = loadData.soundOutputs[key].url;
							this.playSoundPage = iconTabs[i].navigationContainerPages[n];
						}
					}
					
				}
			}
		}
	}
	
	//when the user clicks accept?
	getSaveData() {
		var outputStateData = {};
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].url != "") {
						outputStateData[iconTabs[i].scope] = {
							    url : iconTabs[i].navigationContainerPages[n].url,
							}
					}
				}
			}
		}
		return {
			soundOutputs : outputStateData
		};
	}
}