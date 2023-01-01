sap.ui.controller("org.wlcp.wlcp-ui.controller.VirtualDevice", {
	
	socket : null,
	username : "",
	modelJSON : {
			games : [],
			teams : [],
			teamPlayers : [],
			nameSuggestions : []
	},
	model : new sap.ui.model.json.JSONModel(this.modelJSON),
	gameInstanceId : 0,
	team : 0,
	player : 0,
	debugMode : false,
	debugGameInstanceId : null,
	restartDebug : null,
	recievedDisplayText : false,
	recievedDisplayPhoto : false,
	recievedPlayVideo : false,
	
	socket : null,
	stompClient : null,
	
	redButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, body: JSON.stringify({ buttonPress : 1})});
	},

	greenButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, body: JSON.stringify({ buttonPress : 2})});
	},

	blueButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, body: JSON.stringify({ buttonPress : 3})});
	},

	blackButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, body: JSON.stringify({ buttonPress : 4})});
	},
	
	submitButtonPressSequence : function() {
		var sequences = $("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable("toArray", {attribute : "class"});
		var sequence = "";
		for(var i = 0; i < sequences.length; i++) {
			if(sequences[i].includes("Red")) {
				sequence = sequence.concat("1");
			} else if(sequences[i].includes("Green")) {
				sequence = sequence.concat("2");
			} else if(sequences[i].includes("Blue")) {
				sequence = sequence.concat("3");
			} else if(sequences[i].includes("Black")) {
				sequence = sequence.concat("4");
			}
		}
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/sequenceButtonPress/" + this.username + "/" + this.team + "/" + this.player, body : JSON.stringify({sequenceButtonPress : sequence})});
		this.clearButtonPressSequence();
	},

		
	submitKeyboardInput : function() {
		var keyboardInput = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--keyboardInputField").getValue().toLowerCase();
		this.resetStateDisplayTypes();
		this.stompClient.publish({destination: "/app/gameInstance/" + this.gameInstanceId + "/keyboardInput/" + this.username + "/" + this.team + "/" + this.player, body : JSON.stringify({keyboardInput : keyboardInput})});
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--keyboardInputField").setValue("");
	},

	submitRandomInput : function() {
		this.stompClient.publish({destination: "/app/gameInstance/" + this.gameInstanceId + "/randomInput/" + this.username + "/" + this.team + "/" + this.player, body : JSON.stringify({})});
	},

	clearButtonPressSequence : function() {
		var children = $("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").children();
		for(var i = 0; i < children.length; i++) {
			children[i].remove();
		}
		document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl").style.width = this.inputBoxWidth.toString() + "px";
		$("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable('refresh');
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressLeft").setEnabled(false); 
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressRight").setEnabled(false); 
	},
	
	onAfterRenderingSequence : function() {
		this.inputBoxWidth = parseInt(getComputedStyle(document.querySelector(".sequencePressColorList2Parent")).width.replace("px", ""));
		$("#container-wlcp-ui---virtualDevice--colorListRed").click(function() {
			$("#container-wlcp-ui---virtualDevice--colorListRed").clone().appendTo($("#container-wlcp-ui---virtualDevice--colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#container-wlcp-ui---virtualDevice--colorListGreen").click(function() {
			$("#container-wlcp-ui---virtualDevice--colorListGreen").clone().appendTo($("#container-wlcp-ui---virtualDevice--colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#container-wlcp-ui---virtualDevice--colorListBlue").click(function() {
			$("#container-wlcp-ui---virtualDevice--colorListBlue").clone().appendTo($("#container-wlcp-ui---virtualDevice--colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#container-wlcp-ui---virtualDevice--colorListBlack").click(function() {
			$("#container-wlcp-ui---virtualDevice--colorListBlack").clone().appendTo($("#container-wlcp-ui---virtualDevice--colorListSortable-listUl"));
			this.up();
		}.bind(this));
		$("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable({
			disabled: true,
			update: function(event, ui) {
				var sequence = $("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable("toArray", { attribute: "class" });
				if(sequence.length >= 5) {
					var newWidth = document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl").clientWidth + (this.inputBoxWidth / 4);
					document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl").style.width = newWidth.toString() + "px";
				}
			}.bind(this)
		});
	},

	up() {
		var sequence = $("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable("toArray", { attribute: "class" });
		if(sequence.length >= 5) {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressLeft").setEnabled(true);
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressRight").setEnabled(false);
			var newWidth = document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl").clientWidth + (this.inputBoxWidth / 4);
			document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl").style.width = newWidth.toString() + "px";
			document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl-parent").scrollTo(newWidth, 0);
		}
		$("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").sortable('refresh');
	},

	scrollLeft() {
		var element = document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl-parent");
		element.scrollTo(element.scrollLeft - (this.inputBoxWidth / 4), 0);
		if(element.scrollLeft === 0) {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressLeft").setEnabled(false);
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressRight").setEnabled(true);
		} else {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressRight").setEnabled(true);
		}
		// if(element.scrollLeft % (this.inputBoxWidth / 4) === 0) {
		// 	element.scrollTo(element.scrollLeft - (this.inputBoxWidth / 4), 0);
		// } else {
		// 	element.scrollTo(element.scrollLeft - (element.scrollLeft % (this.inputBoxWidth / 4)), 0);
		// }
	},

	scrollRight() {
		var element = document.getElementById("container-wlcp-ui---virtualDevice--colorListSortable-listUl-parent");
		element.scrollTo(element.scrollLeft + (this.inputBoxWidth / 4), 0);
		if(element.scrollLeft === ((this.inputBoxWidth / 4) * ($("#container-wlcp-ui---virtualDevice--colorListSortable-listUl").children().length - 4))) {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressRight").setEnabled(false);
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressLeft").setEnabled(true);
		} else {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--scrollSequenceButtonPressLeft").setEnabled(true);
		}
		// if(element.scrollLeft % (this.inputBoxWidth / 4) === 0) {
		// 	element.scrollTo(element.scrollLeft + (this.inputBoxWidth / 4), 0);
		// } else {
		// 	element.scrollTo(element.scrollLeft + (this.inputBoxWidth / 4) - (element.scrollLeft % (this.inputBoxWidth / 4)), 0);
		// }
	},

	joinGameInstance : function() {
		if(this.username === "*") { 
			var gameInstanceId = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").getValue();
			if(gameInstanceId != "") {
				this.gameInstanceId = parseInt(gameInstanceId);
				RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/playersAvaliable/" + this.gameInstanceId + "/" + this.username, true, function() {
					sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer").to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--enterTempName"));
				}, this.gameInstanceIdError, this);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").setValue("");
			} else {
				sap.m.MessageBox.error("Game PIN Field Cannot Be Empty!");
			}
			return; 
		}
		var gameInstanceId = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").getValue();
		if(gameInstanceId != "") {
			this.gameInstanceId = parseInt(gameInstanceId);
			RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/playersAvaliable/" + this.gameInstanceId + "/" + this.username, true, this.handleGameTeamsAndPlayers, this.gameInstanceIdError, this);
		} else {
			sap.m.MessageBox.error("Game PIN Field Cannot Be Empty!");
		}
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").setValue("");
	},

	changeToEnterGamePin : function(oEvent) {
		this.guestPlayer = true;
		this.username = oEvent.getSource().getParent().getItems()[1].getValue();
		if(this.username === null || this.username === "") { 
			sap.m.MessageBox.error("That player name is invalid!");
			return;
		}
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--tempNameInput").setValue("");
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/playersAvaliable/" + this.gameInstanceId + "/" + this.username, true, this.handleGameTeamsAndPlayers, this.playerNameError, this);
	},
	
	joinDebugGameInstance : function() {
		this.gameInstanceId = this.debugGameInstanceId;
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/playersAvaliable/" + this.gameInstanceId + "/" + this.username, true, this.handleGameTeamsAndPlayers, this.gameInstanceIdError, this);
	},
	
	gameInstanceIdError : function() {
		sap.m.MessageBox.error("Game PIN Does not Exist!");
	},

	playerNameError : function() {
		sap.m.MessageBox.error("That player name is invalid!");
	},
	
	handleGameTeamsAndPlayers : function(response) {
		this.modelJSON.teamPlayers = [];
		this.model.setData(this.modelJSON);
		if(response.length === 1 && response[0].type === "USERNAME_EXISTS") {
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer").to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--nameTaken"));
			var nameSuggestions = [];
			for(var i = 0; i < 5; i++) {
				nameSuggestions.push({text : this.username + Math.floor(Math.random() * 100)});
			}
			this.modelJSON.nameSuggestions = {
				newUsername : "",
				team : response[0].team + 1,
				player : response[0].player + 1,
				suggestions : nameSuggestions,
				usernameId : this.username
			};
			for(var i = 0; i < response.length; i++) {
				this.modelJSON.teamPlayers.push({team : response[i].team + 1, player : response[i].player + 1});
			}
			this.model.setData(this.modelJSON);
		} else {
			var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer");
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--selectTeamPlayer"));
			for(var i = 0; i < response.length; i++) {
				this.modelJSON.teamPlayers.push({team : response[i].team + 1, player : response[i].player + 1});
			}
			this.model.setData(this.modelJSON);
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--teamPlayerSelect").setSelectedItem(null);
		}
	},

	rename : function() {
		var event = {
			getSource : function() {
				return {
					getParent : function() {
						return {
							getItems : function() {
								var items = [];
								items.push({});
								items.push({
									getValue : function() {
										if(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--newName").getValue() !== "") {
											return sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--newName").getValue();
										} else {
											return sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--newNameSuggestion").getSelectedKey();
										}
									}
								})
								return items;
							}
						}
					}
				}
			}
		}
		this.changeToEnterGamePin(event);
	},

	reconnect : function() {
		this.requestBusyDialog();
		var selectedTeamPlayer = this.modelJSON.teamPlayers[0];
		this.setupSocketConnection(selectedTeamPlayer.team - 1, selectedTeamPlayer.player - 1);
	},
	
	onTeamPlayerSelected : function(oEvent) {
		this.requestBusyDialog();
		var selectedTeamPlayer = this.model.getProperty(oEvent.getSource().getParent().getItems()[1].getSelectedItem().getBindingContext().getPath());
		this.setupSocketConnection(selectedTeamPlayer.team - 1, selectedTeamPlayer.player - 1);
	},
	
	setupSocketConnection : function(team, player) {
			var that = this;
			this.stompClient = new StompJs.Client({
				webSocketFactory : function() {
					return new WebSocket(ServerConfig.getGameServerWebSocketAddress());
				}
			});
			this.stompClient.onConnect = function (frame) {
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextArea").setValue(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gamePlayer.connecting"));
				that.connectToGameInstance(that.gameInstanceId, team, player);
			};
			this.stompClient.onStompError = function (frame) {
				Logger.error("error connecting");
				Logger.error(frame);
				that.closeBusyDialog();
			};
			this.stompClient.activate();
	},
	
	connectToGameInstance(gameInstanceId, team, player) {
		var that = this;
	    this.connectionResultSubscription = this.stompClient.subscribe("/subscription/connectionResult/" + gameInstanceId + "/" + this.username + "/" + team + "/" + player, function(response) {
	    	var jsonResponse = JSON.parse(response.body);
	    	if(jsonResponse.code == "FAIL") { 
				var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer");
				navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--selectGameInstance"));
				sap.m.MessageBox.error("That team and player are taken! Someone else may have taken it before you.");
				that.closeBusyDialog();
				return;
	    	}
	    	that.team = jsonResponse.team;
	    	that.player = jsonResponse.player;
	    	that.connectionResultSubscription.unsubscribe();
			var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer");
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDevicePage"));
			if(that.guestPlayer) {
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--userTeamPlayer").setText(that.username + "(guest)-T" + (that.team + 1) + "P" + (that.player + 1));
			} else {
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--userTeamPlayer").setText(that.username + "-T" + (that.team + 1) + "P" + (that.player + 1));
			}
			that.closeBusyDialog();
		});
    	this.subscribeToChannels(gameInstanceId, team, player);
		this.stompClient.publish({destination : "/app/gameInstance/" + gameInstanceId + "/connectToGameInstance/" + this.username + "/" + team + "/" + player, body : {}});
	},
	
	subscribeToChannels : function(gameInstanceId, team, player) {
		var that = this;
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/noState/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToStateType("NoState");
			that.stopAudio();
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/displayText/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			that.recievedDisplayText = true
			//photo already initialized
			if(that.recievedDisplayText && (that.recievedDisplayPhoto || that.recievedPlayVideo)){
				var displayTextBox = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextLabel");
				displayTextBox.setText(parsedJson.displayText); //this becomes id of displayTextPhoto Label
				displayTextBox = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayVideoTextLabel");
				displayTextBox.setText(parsedJson.displayText); //this becomes id of displayTextPhoto Label
			}
			else {
				var displayTextBox = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextArea");
				displayTextBox.setValue(parsedJson.displayText); //this becomes id in displayText TextArea
				that.switchToStateType("DisplayText");
			}
			that.stopAudio();
			//that.switchToStateType("DisplayPhoto");
			//displayTextBox.setValue(parsedJson.displayText);
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/displayPhoto/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			//Logger.debug(parsedJson);
			that.recievedDisplayPhoto = true;
			//load text if exists
			if(that.recievedDisplayText) {
				var displayTextLabel = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextLabel");
				displayTextLabel.setText(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextArea").getValue());
			}
			
			var displayPhoto = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayPhotoImage");
			//load image
			var img = new Image();
			img.addEventListener("load", $.proxy(function() {
				displayPhoto.setHeight(img.naturalHeight * (parsedJson.scale/100) + "px");
				displayPhoto.setWidth(img.naturalWidth * (parsedJson.scale/100) + "px");
				displayPhoto.setSrc(parsedJson.url);
			}, this));
			img.src = parsedJson.url;
			that.switchToStateType("DisplayTextPhoto");
			that.stopAudio();
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/playSound/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			that.playSound = new Audio(parsedJson.url);
			that.playSound.play();
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/playVideo/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			that.recievedPlayVideo = true;
			//load text if exists
			if(that.recievedDisplayText) {
				var displayTextLabel = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayVideoTextLabel");
				displayTextLabel.setText(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextArea").getValue());
			}
			that.waitForElementToDisplay("#videoPlayer", function() {
				that.videoPlayer = document.getElementById("videoPlayer");
				that.videoPlayer.src = parsedJson.url;
			}, 100, 9000);
			that.switchToStateType("DisplayTextVideo");
			that.stopAudio();
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/noTransition/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("NoTransition");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/singleButtonPressRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.setSingleButtonPressLabels(response);
			that.switchToTransitionType("SingleButtonPress");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/sequenceButtonPressRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("SequenceButtonPress");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/keyboardInputRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("KeyboardInput");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/randomInputRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("RandomInput");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/timerDurationRequest/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			if(!parsedJson.isTimer) {
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerDuration").getContent()[0].getItems()[0].setText("Timer Duration: " + parsedJson.duration);
				that.switchToTransitionType("TimerDuration");
				var timeleft = parsedJson.duration;
				var timer = setInterval(function(){
					if(timeleft <= 0){
					  clearInterval(timer);
					}
					sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerDuration").getContent()[0].getItems()[0].setText("Timer Duration: " + timeleft);
					timeleft -= 1;
				}, 1000);
			} else {
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSingle").setVisible(true);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSequence").setVisible(true);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextKeyboard").setVisible(true);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSingle").setText("Timer Duration: " + parsedJson.duration);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSequence").setText("Timer Duration: " + parsedJson.duration);
				sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextKeyboard").setText("Timer Duration: " + parsedJson.duration);
				var timeleft = parsedJson.duration;
				var timer = setInterval(function(){
					if(timeleft <= 0){
					  clearInterval(timer);
					  sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSingle").setVisible(false);
					  sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSequence").setVisible(false);
					  sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextKeyboard").setVisible(false);
					}
					sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSingle").setText("Timer Duration: " + timeleft);
					sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextSequence").setText("Timer Duration: " + timeleft);
					sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerTextKeyboard").setText("Timer Duration: " + timeleft);
					timeleft -= 1;
				}, 1000);
			}
			
		});
	},

	stopAudio : function() {
		if(typeof this.playSound !== "undefined") {
			this.playSound.pause();
		}
		if(typeof this.videoPlayer !== "undefined") {
			this.videoPlayer.pause();
		}
	},
	
	disconnectPressed : function() {
		var that = this;
	    this.disconnectResultSubscription = this.stompClient.subscribe("/subscription/disconnectionResult/" + this.gameInstanceId + "/" + this.username + "/" + this.team + "/" + this.player, function(response) {
	    	that.disconnectResultSubscription.unsubscribe();
	    	that.stompClient.deactivate();
	    	that.onClose();
	    });
		this.stompClient.publish({destination : "/app/gameInstance/" + this.gameInstanceId + "/disconnectFromGameInstance/" + this.username + "/" + this.team + "/" + this.player, body : {}});
	},
	
	onClose : function() {
		if(!this.debugMode) {
			sap.m.MessageBox.error("The connection was closed! This may have happened if you disconnected, locked your device or the screen turned off. The page will now refresh. Please re-login to continue where you left off in the game.", { onClose : function() {
				this.resetVirtualDevice();
				this.onHomeButtonPress();
			}.bind(this)});
		} else {
			window.close();
		}
	},
	
	switchToStateType : function(type) {
		var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--outputContainer");
		switch(type) {
		case "NoState":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--noState"));
			break;
		case "DisplayText":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextPage"));
			break;
		case "DisplayTextPhoto":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextPhotoPage"));
			break;
		case "DisplayTextVideo":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextVideoPage"));
			break;
		}
	},
	
	switchToTransitionType : function(type) {
		var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--inputContainer");
		switch(type) {
		case "NoTransition":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--noTransition"));
			break;
		case "SingleButtonPress":
			navContainer.afterNavigate = null;
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--singleButtonPress"));
			break;
		case "SequenceButtonPress":
			var page = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--sequenceButtonPress");
			page.onAfterRendering = $.proxy(this.onAfterRenderingSequence, this);
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--sequenceButtonPress"));
			break;
		case "KeyboardInput":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--keyboardInput"));
			break;
		case "RandomInput":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--randomInput"));
			break;
		case "TimerDuration":
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--timerDuration"));
			break;
		}
	},

	resetVirtualDevice : function () {
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").setValue("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--tempNameInput").setValue("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--teamPlayerSelect").setSelectedItem(null);
		this.resetStateDisplayTypes();
		this.switchToStateType("DisplayText");
		this.switchToTransitionType("NoTransition");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextArea").setValue("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayTextLabel").setText("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayVideoTextLabel").setText("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--displayPhotoImage").setSrc("");
		this.playSound = undefined;
		if(document.getElementById("videoPlayer") !== null) {
			document.getElementById("videoPlayer").src = "";
		}
		if(document.getElementById('#container-wlcp-ui---virtualDevice--colorListSortable-listUl') !== null) {
			this.clearButtonPressSequence();
		}
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--keyboardInputField").setValue("");
		this.guestPlayer = undefined;
	},
	
	resetStateDisplayTypes : function() {
		this.recievedDisplayText = false;
		this.recievedDisplayPhoto = false;	
		this.recievedPlayVideo = false;
	},

	onHomeButtonPress : function() {
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--gamePinInput").setValue("");
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--tempNameInput").setValue("");
		if(this.tempPlayer) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteLoginView");
		} else {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");
		}
	},

	waitForElementToDisplay : function(selector, callback, checkFrequencyInMs, timeoutInMs) {
		var startTimeInMs = Date.now();
		(function loopSearch() {
		  if (document.querySelector(selector) != null) {
			callback();
			return;
		  }
		  else {
			setTimeout(function () {
			  if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs)
				return;
			  loopSearch();
			}, checkFrequencyInMs);
		  }
		})();
	},

	requestBusyDialog : function() {
		if(typeof this.busyDialog === "undefined") {
			this.busyDialog = new sap.m.BusyDialog();
		}
		this.fallback = setTimeout(function() {
			this.busyDialog.close();
		}.bind(this), 30000);
		this.busyDialog.open();
	},

	closeBusyDialog : function() {
		this.busyDialog.close();
		clearTimeout(this.fallback);
	},

	setSingleButtonPressLabels : function(response) {
		var parsedJson = JSON.parse(response.body);
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--redButton").setText(parsedJson.label1);
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--greenButton").setText(parsedJson.label2);
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--blueButton").setText(parsedJson.label3);
		sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--blackButton").setText(parsedJson.label4);
	},
	  

/**
 * Called when a controller is instantiated and its View controls (if available)
 * are already created. Can be used to modify the View before it is displayed,
 * to bind event handlers and do other one-time initialization.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
	onInit: function() {
		
		window.onbeforeunload = function() {
			return "Are you sure you want to leave this page? You will lose all unsaved data!";
		};

		sap.ui.core.UIComponent.getRouterFor(this).getRoute("RouteVirtualDeviceView").attachMatched(this.onRouteMatched, this);
		sap.ui.core.UIComponent.getRouterFor(this).getRoute("RouteModeSelectionView").attachMatched(this.onRouteMatchedBack, this);
	},

	onRouteMatched : function (oEvent) {
		if(oEvent.getParameter("arguments").debugMode == "true") {
			this.username = oEvent.getParameter("arguments").username;
			this.debugGameInstanceId = oEvent.getParameter("arguments").gameInstanceId;
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--selectTeamPlayer").getContent()[0].getContent()[2].setVisible(false);
			sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDevicePage").getContent()[0].getContent()[4].setVisible(false);
			this.debugMode = true;
			this.joinDebugGameInstance();
		} else {
			this.username = oEvent.getParameter("arguments").username;
			this.debugMode = false;
			var navContainer = sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--virtualDeviceNavContainer");
			navContainer.to(sap.ui.getCore().byId("container-wlcp-ui---virtualDevice--selectGameInstance"));
			this.tempPlayer = this.username === "*" ? true : false;
		}
		this.getView().setModel(this.model);
	},

	onRouteMatchedBack : function(oEvent) {
		this.resetVirtualDevice();
	},

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's
 * View is re-rendered (NOT before the first rendering! onInit() is used for
 * that one!).
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onBeforeRendering: function() {
//
// },

/**
 * Called when the View has been rendered (so its HTML is part of the document).
 * Post-rendering manipulations of the HTML could be done here. This hook is the
 * same one that SAPUI5 controls get after being rendered.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onAfterRendering: function() {
//
// },

/**
 * Called when the Controller is destroyed. Use this one to free resources and
 * finalize activities.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onExit: function() {
//
// }

});