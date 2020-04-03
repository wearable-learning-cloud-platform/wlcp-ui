var ServerConfig = {
	
	getServerAddress : function() {
		return window.location.origin + "/wlcp-api";
	},

	getGameServerAddress : function() {
		return window.location.origin + "/wlcp-gameserver";
	},

	getGameServerWebSocketAddress : function() {
		var address = window.location.origin + "/wlcp-gameserver/wlcpGameServer-ws/0";
		return address.replace("http", "ws");
	}
}