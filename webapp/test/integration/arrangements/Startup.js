sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	return Opa5.extend("org.wlcp.wlcp-ui.test.integration.arrangements.Startup", {

		iStartMyApp: function () {
			this.iStartMyUIComponent({
				componentConfig: {
					name: "org.wlcp.wlcp-ui",
					async: true,
					manifest: true
				}
			});
		}

	});
});
