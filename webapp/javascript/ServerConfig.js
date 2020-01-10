var ServerConfig = {
	
	getServerAddress : function() {
		return window.location.origin + "/wlcp-ui/rest/controllers";
	},

	getGameServerAddress : function() {
		return window.location.origin + "/wlcp-ui/gameserver";
	}
}