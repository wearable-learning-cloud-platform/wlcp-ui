sap.ui.define([
	"sap/ui/test/Opa5",
	"org/wlcp/wlcp-ui/test/integration/arrangements/Startup",
	"org/wlcp/wlcp-ui/test/integration/BasicJourney"
], function(Opa5, Startup) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		pollingInterval: 1
	});

});
