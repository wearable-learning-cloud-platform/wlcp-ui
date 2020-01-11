var ServerConfig = {
	
	getServerAddress : function() {
		return window.location.origin + "/wlcp-ui/rest/controllers";
	},

	getGameServerAddress : function() {
		return window.location.origin + "/wlcp-ui/gameserver";
	},

	getGameServerWebSocketAddress : function() {
		var location = window.location.origin + "/wlcp-ui/gameserver-ws";
		return location;
		//return location.replace("http", "ws");
	}
}