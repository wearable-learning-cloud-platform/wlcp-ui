var StateConfigPlaySound = class StateConfigPlaySound extends StateConfig {
	
	constructor(state) {
		super(state);
		this.playSoundPage = null;
	}
	
	//side bar in configure window list of available states
	getNavigationListItem() {
		return {	
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playSound"),
			type : StateConfigType.PLAY_SOUND,
			icon : "sap-icon://sound-loud"	
		}
	}
	
	//return title of page
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playSound"),
			type : StateConfigType.PLAY_SOUND,
			url : "",
		}
    }

    urlUpdated(oEvent) {
        this.onChange(oEvent);
    }
    
    handleUploadPress() {
		var oFileUploader = null;
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
						oFileUploader = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems()[i].getContent()[0].getContentAreas()[1].getPages()[2].getContent()[2].getItems()[0];
						break;
					}
				}
			}
		}

		oFileUploader.setUploadUrl(ServerConfig.getServerAddress() + "/objectStoreController/uploadFile");
		if(oFileUploader.getHeaderParameters().length == 0) {
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name : "Authorization",
				value : "Bearer " + SessionHelper.getCookie("wlcp.userSession")
			}));
		}
		oFileUploader.setSendXHR(true);

		oFileUploader.checkFileReadable().then(function(oEvent) {
			if(typeof this.sound !== "undefined") {
				this.stop();
				this.sound = undefined;
			}
			this.testForNewOrOverwrite(oFileUploader, oEvent);
		}.bind(this), function(error) {
			MessageToast.show("Error reading file!");
		});
	}

	handleUploadComplete(oEvent) {
		var sResponse = oEvent.getParameter("responseRaw");
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
						this.playSoundPage = iconTabs[i].navigationContainerPages[n];
						this.playSoundPage.url = ServerConfig.getServerAddress() + "/objectStoreController/files/" + sResponse;
                        this.state.model.setData(this.state.modelJSON);
                        this.urlUpdated(oEvent);
						break;
					}
				}
			}
		}
		this.busyDialog.close();
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
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
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
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStatePlaySoundConfig", this);
	}
	
	//returns verified scopes Team 1, Player 2, Game Wide ect
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
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
						if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
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
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.PLAY_SOUND) {
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

	stopSound() {
		if(typeof this.sound !== "undefined") {
			this.sound.pause();
			this.sound = undefined;
		}
	}

	acceptStateConfig(oEvent) {
		this.stopSound();
	}

	closeStateConfig(oEvent) {
		this.stopSound();
	}

	scopeSelected(oEvent) {
		this.stopSound();
	}

	stateConfigSelected(oEvent) {
		this.stopSound();
	}
}