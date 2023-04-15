sap.ui.controller("org.wlcp.wlcp-ui.controller.Login", {
	
	modelData : {
		username : "",
		password : "",
		newUser : {
			usernameId : "",
			password : "",
			firstName : "",
			lastName : "",
		}
	},
	
	model : new sap.ui.model.json.JSONModel(),

	createModelData : function() {
		this.model = new sap.ui.model.json.JSONModel({
			username : "",
			password : "",
			newUser : {
				usernameId : "",
				password : "",
				firstName : "",
				lastName : "",
			}
		});
	},
	
	validateLogin : function() {
		var loginDto = {
			usernameId : this.model.getData().username,
			password : this.model.getData().password
		}
		RestAPIHelper.post("/login", loginDto, true, this.success, this.error, this);
	},
	
	success : function() {
		if(SessionHelper.sessionCookieValid()) {
			SessionHelper.setupNewSession(this);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");
		} else {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteLoginView");
		}
		// Log BUTTON_PRESS event: button-login-success
		Logger.info("Button Press Login Success");
		MetricsHelper.saveLogEvent({
			"logEventType" : MetricsHelper.LogEventType.BUTTON_PRESS,
			"logContext" : MetricsHelper.LogContext.LOGIN,
			"usernameId" : this.model.getProperty("/username"),
			"gameId" : null,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(),
			"buttonPressed" : "button-login-success"
		});
		this.resetDataModel();
	},
	
	error : function(error) {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("login.message.validationError"));
		// Log BUTTON_PRESS event: button-login-error
		Logger.info("Button Press Login Error");
		MetricsHelper.saveLogEvent({
			"logEventType" : MetricsHelper.LogEventType.BUTTON_PRESS,
			"logContext" : MetricsHelper.LogContext.LOGIN,
			"usernameId" : this.model.getProperty("/username"),
			"gameId" : null,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(),
			"buttonPressed" : "button-login-error"
		});
	},
	
	registerNewUser : function() {
		
		//Create an instance of the dialog
		this.registerNewUserDialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.RegisterNewUser", this);
		
		//Set the model for the dialog
		this.registerNewUserDialog.setModel(this.model);
		
		//Open the dialog
		this.registerNewUserDialog.open();
	},

	confirmRegisterNewUser : function() {
		var registerData = this.model.getData().newUser;
		
		//Convert the username to all lower case
		registerData.usernameId = registerData.usernameId.toLowerCase();

		//Populate the DTO
		var userRegistrationDto = {
			usernameId : registerData.usernameId,
			password : registerData.password,
			firstName : registerData.firstName,
			lastName : registerData.lastName
		}
		
		//If we get here we can register them
		RestAPIHelper.post("/usernameController/registerUser", userRegistrationDto, true, function(data) {
			// Log BUTTON_PRESS event: button-register-new-user-success
			Logger.info("Button Press Register User Success");
			MetricsHelper.saveLogEvent({
				"logEventType" : MetricsHelper.LogEventType.BUTTON_PRESS,
				"logContext" : MetricsHelper.LogContext.LOGIN,
				"usernameId" : this.model.getProperty("/newUser/usernameId"),
				"gameId" : null,
				"gameInstanceId" : null,
				"timeStamp" : Date.now(),
				"buttonPressed" : "button-register-new-user-success"
			});
			this.cancelRegisterNewUser();
			sap.m.MessageBox.success(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("register.message.success"));
		}, function(error) {
			//Let the default handler handle the error
			// Log BUTTON_PRESS event: button-register-new-user-error
			Logger.info("Button Press Register User Error");
			MetricsHelper.saveLogEvent({
				"logEventType" : MetricsHelper.LogEventType.BUTTON_PRESS,
				"logContext" : MetricsHelper.LogContext.LOGIN,
				"usernameId" : this.model.getProperty("/newUser/usernameId"),
				"gameId" : null,
				"gameInstanceId" : null,
				"timeStamp" : Date.now(),
				"buttonPressed" : "button-register-new-user-error"
			});
		}, this);

	},
	
	cancelRegisterNewUser : function() {
		this.registerNewUserDialog.close();
		this.registerNewUserDialog.destroy();
		// Log BUTTON_PRESS event: button-cancel-registration
		Logger.info("Button Press Cancel Registration");
		MetricsHelper.saveLogEvent({
			"logEventType" : MetricsHelper.LogEventType.BUTTON_PRESS,
			"logContext" : MetricsHelper.LogContext.LOGIN,
			"usernameId" : this.model.getProperty("/newUser/usernameId"),
			"gameId" : null,
			"gameInstanceId" : null,
			"timeStamp" : Date.now(),
			"buttonPressed" : "button-cancel-registration"
		});
		this.model.setProperty("/newUser/usernameId", "");
		this.model.setProperty("/newUser/password", "");
		this.model.setProperty("/newUser/firstName", "");
		this.model.setProperty("/newUser/lastName", "");
	},

	resetDataModel() {
		this.createModelData();
		this.getView().setModel(this.model);
	},

	changeToLogin() {
		sap.ui.getCore().byId("__xmlview0--loginNavContainer").to("__xmlview0--mainLogin");
	},

	changeToPlayAGame() {
		sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteVirtualDeviceView", {
			username : "*",
            gameInstanceId : 0,
            debugMode : false
        });
	},

	changeToMainPage() {
		this.resetDataModel();
		sap.ui.getCore().byId("__xmlview0--loginNavContainer").to("__xmlview0--mainMenu");
	},

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.Login
*/
	onInit: function() {
		
		//Set the data to the model
		this.model.setData(this.modelData);
		this.getView().setModel(this.model);
		
		this.getView().addEventDelegate({
			  onAfterRendering: function(){

			  }
			}, this);
	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf wlcpfrontend.views.Login
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf wlcpfrontend.views.Login
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf wlcpfrontend.views.Login
*/
//	onExit: function() {
//
//	}

});