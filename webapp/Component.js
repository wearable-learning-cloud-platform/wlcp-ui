sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/core/routing/HashChanger",
	"org/wlcp/wlcp-ui/model/models",
	"sap/base/Log"
], function(UIComponent, Device, HashChanger, models, Log) {
	"use strict";

	return UIComponent.extend("org.wlcp.wlcp-ui.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {

			//If there is no user session reset the navigation
			if(this.getCookie("wlcp.userSession") == "") {
				HashChanger.getInstance().replaceHash("");
			}

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// set the i18n model
			sap.ui.getCore().setModel(new sap.ui.model.resource.ResourceModel({bundleName : "org.wlcp.wlcp-ui.i18n.i18n"}), "i18n");
	
			// load external resources such as JavaScript
			this.loadExternalResources();

			// set the logger
			Logger.init(Log);
		},

		loadExternalResources : function() {

			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-core');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-widget');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-mouse');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-droppable');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-draggable');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-sortable');
			jQuery.sap.require("sap.m.MessageBox");

			sap.ui.localResources("javascript");

			jQuery.sap.require("javascript/GameEditor/state/State");
			jQuery.sap.require("javascript/GameEditor/state/StartState");
			jQuery.sap.require("javascript/GameEditor/state/OutputState");
			
			jQuery.sap.require("javascript/GameEditor/transition/Transition");
			jQuery.sap.require("javascript/GameEditor/transition/InputTransition");
			
			jQuery.sap.require("javascript/GameEditor/connection/Connection");
			
			jQuery.sap.require("javascript/GameEditor/validation/ValidationEngine/ValidationEngineHelpers");
			
			jQuery.sap.require("javascript/GameEditor/validation/ValidationRule");
			jQuery.sap.require("javascript/GameEditor/validation/ConnectionValidationRules");
			jQuery.sap.require("javascript/GameEditor/validation/StateValidationRules");
			jQuery.sap.require("javascript/GameEditor/validation/TransitionValidationRules");
			
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfig");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigType");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigDisplayText");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigDisplayPhoto");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigPlaySound");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigPlayVideo");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigGlobalVariable");
			
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfig");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigType");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigSingleButtonPress");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigSequenceButtonPress");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigKeyboardInput");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigTimer");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigRandom");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigGlobalVariable");

			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StartStateConfigGlobalVariables");
			
			jQuery.sap.require("javascript/GameEditor/GameEditor");
			jQuery.sap.require("javascript/ServerConfig");
			jQuery.sap.require("javascript/RestAPIHelper");
			jQuery.sap.require("javascript/SessionHelper");
			jQuery.sap.require("javascript/MetricsHelper");
			jQuery.sap.require("javascript/Logger");
			
			jQuery.sap.require("javascript/jsplumb-2-13-1");
			jQuery.sap.require("javascript/path-data-polyfill");
			jQuery.sap.require("javascript/jquery-ui-touch-punch-min");
			jQuery.sap.require("javascript/stomp");
			jQuery.sap.require("javascript/jwt-decode");
			jQuery.sap.require("javascript/md5");
			jQuery.sap.require("javascript/video");
			
		},

		getCookie : function(cname) {
			var name = cname + "=";
			var decodedCookie = decodeURIComponent(document.cookie);
			var ca = decodedCookie.split(';');
			for(var i = 0; i <ca.length; i++) {
			  var c = ca[i];
			  while (c.charAt(0) == ' ') {
				c = c.substring(1);
			  }
			  if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			  }
			}
			return "";
		  }
	});
});
