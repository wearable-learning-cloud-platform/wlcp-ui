var GameEditor = {
		
	getEditor : function() {
		return sap.ui.getCore().byId("container-wlcp-ui---gameEditor");
	},

	getEditorController : function() {
		return this.getEditor().getController();
	},
	
	getJsPlumbInstance : function() {
		return this.getEditor().getController().jsPlumbInstance;
	},
	
	getScrollTopOffset : function() {
		return document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTop;
	},
	
	getScrollLeftOffset : function() {
		return document.getElementById("container-wlcp-ui---gameEditor--pad").scrollLeft;
	},
	
	resetScroll : function() {
		document.getElementById("container-wlcp-ui---gameEditor--pad").style.width = "100%";
		document.getElementById("container-wlcp-ui---gameEditor--pad").style.height = "100%";
		document.getElementById("scrollPlaceHolder").style.top = "0px";
		document.getElementById("scrollPlaceHolder").style.left = "0px";
	}

}

var GameEditorScroller = class GameEditorScrollHelper {
	constructor() {
		this.timer = null;
		this.leftMouseDown = false;
	}

	handleMousemove(event, state) {
		if(!this.leftMouseDown) { clearTimeout(this.timer); return; }

		var clientX = event.clientX;
		var clientY = event.clientY;

		var s = state;
		if(typeof(state) !== "undefined") {
			state = event;
			event = s;
			clientX = (state.getPositionX() - document.getElementById("container-wlcp-ui---gameEditor--pad").scrollLeft) + document.getElementById("container-wlcp-ui---gameEditor--toolbox").getBoundingClientRect().width;
			clientY = (state.getPositionY() - document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTop) + (document.getElementById("__header0").getBoundingClientRect().height + document.getElementById("container-wlcp-ui---gameEditor--padPage-intHeader").getBoundingClientRect().height);
		}


		var viewportX = clientX - document.getElementById("container-wlcp-ui---gameEditor--toolbox").getBoundingClientRect().width;
		var viewportY = clientY - (document.getElementById("__header0").getBoundingClientRect().height + document.getElementById("container-wlcp-ui---gameEditor--padPage-intHeader").getBoundingClientRect().height);
		//Logger.debug(viewportX + " " + viewportY);
		var viewportWidth = document.getElementById("container-wlcp-ui---gameEditor--pad").clientWidth;
		var viewportHeight = document.getElementById("container-wlcp-ui---gameEditor--pad").clientHeight;
		
		var edgeSize = 50;
		var edgeTop = edgeSize;
		var edgeLeft = edgeSize;
		var edgeBottom = ( viewportHeight - edgeSize * 2.0 );
		var edgeRight = ( viewportWidth - edgeSize * 2.5 );
		var isInLeftEdge = ( viewportX < -edgeLeft );
		var isInRightEdge = ( viewportX > edgeRight );
		var isInTopEdge = ( viewportY < -edgeTop );
		var isInBottomEdge = ( viewportY > edgeBottom );
		//Logger.debug("left: " + isInLeftEdge + " right: " + isInRightEdge + " top: " + isInTopEdge + " bottom: " + isInBottomEdge);
		if ( ! ( isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge) ) {
			clearTimeout(this.timer);
			return;
	
		}
		var documentWidth = document.getElementById("container-wlcp-ui---gameEditor--pad").scrollWidth;
		var documentHeight = document.getElementById("container-wlcp-ui---gameEditor--pad").scrollHeight;
		var maxScrollX = ( documentWidth - viewportWidth );
		var maxScrollY = ( documentHeight - viewportHeight );
		(function checkForWindowScroll(scrollHelper) {
	 
			clearTimeout(scrollHelper.timer);
	
			if ( adjustWindowScroll() ) {
	
				scrollHelper.timer = setTimeout( checkForWindowScroll, 15, scrollHelper );
	
			}
	
		})(this);
		function adjustWindowScroll() {
			var currentScrollX = document.getElementById("container-wlcp-ui---gameEditor--pad").scrollLeft;
			var currentScrollY = document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTop;
			var canScrollUp = ( currentScrollY > 0 );
			var canScrollDown = ( currentScrollY < maxScrollY );
			var canScrollLeft = ( currentScrollX > 0 );
			var canScrollRight = ( currentScrollX < maxScrollX );
			var nextScrollX = currentScrollX;
			var nextScrollY = currentScrollY;
			var maxStep = 5;
			var maxIntensity = 2.0;
			if ( isInLeftEdge && canScrollLeft ) {
				var intensity = ( ( edgeLeft - viewportX ) / edgeSize );
				intensity = Math.min(Math.max(intensity, 0), maxIntensity);
				nextScrollX = ( nextScrollX - ( maxStep * intensity ) );
			} else if ( isInRightEdge && canScrollRight ) {
				var intensity = ( ( viewportX - edgeRight ) / edgeSize );
				intensity = Math.min(Math.max(intensity, 0), maxIntensity);
				nextScrollX = ( nextScrollX + ( maxStep * intensity ) );
			}
			if ( isInTopEdge && canScrollUp ) {
				var intensity = ( ( edgeTop - viewportY ) / edgeSize );
				intensity = Math.min(Math.max(intensity, 0), maxIntensity);
				nextScrollY = ( nextScrollY - ( maxStep * intensity ) );
			} else if ( isInBottomEdge && canScrollDown ) {
				var intensity = ( ( viewportY - edgeBottom ) / edgeSize );
				intensity = Math.min(Math.max(intensity, 0), maxIntensity);
				//console.log("viewPortY: " + viewportY + " edgeBottom: " + edgeBottom + " intensity: " + intensity);
				nextScrollY = ( nextScrollY + ( maxStep * intensity ) );
			}
			nextScrollX = Math.max( 0, Math.min( maxScrollX, nextScrollX ) );
			nextScrollY = Math.max( 0, Math.min( maxScrollY, nextScrollY ) );
			//Logger.debug("X: " + nextScrollX + " Y: " +nextScrollY);
			if (
				( nextScrollX !== currentScrollX ) ||
				( nextScrollY !== currentScrollY )
				) {
	
				document.getElementById("container-wlcp-ui---gameEditor--pad").scrollTo(nextScrollX, nextScrollY);
				return( true );
	
			} else {
	
				return( false );
	
			}
		}
	}
}

var GameEditorZoomHelpers = {

	calculateDiff : function(pos, origin, scale, zoomLevel, oldZoomLevel, depth) {
		var totalDx = typeof(pos.dx) === "undefined" ? 0 : pos.dx;
		var totalDy = typeof(pos.dy) === "undefined" ? 0 : pos.dy;
		var posX = typeof(pos.x) === "undefined" ? 0 : pos.x;
		var posY = typeof(pos.y) === "undefined" ? 0 : pos.y;
		for(var i = 0; i < depth; i ++) {
			//Calcaulate the change in x and y based on the difference between the origin and the state
			var dx = (posX - origin.x) * (zoomLevel < oldZoomLevel ? -1 : 1);
			var dy = (posY - origin.y) *  (zoomLevel < oldZoomLevel ? -1 : 1);
			if(zoomLevel < oldZoomLevel) {
				dx = dx * scale;
				dy = dy * scale;
			} else {
				dx = dx / (1 - scale) * scale;
				dy = dy / (1 - scale) * scale;
			}

			totalDx = totalDx + parseInt(dx);
			totalDy = totalDy + parseInt(dy);
			posX = posX + parseInt(dx);
			posY = posY + parseInt(dy);
		}
		return { totalDx, totalDy, posX, posY };
	},

	calculateSize : function(input, scale, zoomLevel, oldZoomLevel) {
		if(zoomLevel < oldZoomLevel) {
			return input * (1 - scale);
		} else {
			return input / (1 - scale);
		}
	},

	calculateSizeByDepth : function(input, scale, zoomLevel, oldZoomLevel, depth) {
		var size = 0;
		for(var i = 0; i < depth; i ++) {
			size = this.calculateSize(input, scale, zoomLevel, oldZoomLevel);
		}
		return size;
	},

	calculateSizeFont : function (input, scale, zoomLevel, oldZoomLevel) {
		if(zoomLevel < oldZoomLevel) {
			return Math.floor(input * (1 - scale));
		} else {
			return Math.ceil(input / (1 - scale));
		}
	},

	startStateAsOrigin : function() {
		//Set the origin to the start state
		var x = 0;
		var y = 0;
		GameEditor.getEditorController().stateList.forEach(function(state) {
			if(state.stateType === "START_STATE") {
				x = parseInt(document.getElementById(state.htmlId).style.left.replace("px", ""));
				y = parseInt(document.getElementById(state.htmlId).style.top.replace("px", ""));
			}
		}.bind(this));
		return {x : x, y : y};
	},

	scaleState : function(state, origin, scale, zoomLevel, oldZoomLevel, calculatePosition = true) {

		if(calculatePosition) {
			//Calcaulate the change in x and y based on the difference between the origin and the state
			var pos = {
				x : parseInt(document.getElementById(state.htmlId).style.left.replace("px", "")),
				y : parseInt(document.getElementById(state.htmlId).style.top.replace("px", ""))
			}
			var diffResults = this.calculateDiff(pos, {x: origin.x, y: origin.y}, scale, zoomLevel, oldZoomLevel, 1);
			state.dx = state.dx + diffResults.totalDx;
			state.dy = state.dy + diffResults.totalDy;
			state.setPositionX(diffResults.posX)
			state.setPositionY(diffResults.posY);
			//position
			document.getElementById(state.htmlId).style.top = state.getPositionY() + "px";
			document.getElementById(state.htmlId).style.left = state.getPositionX() + 'px';
		}

		//Calculate size
		var stateWidth = this.calculateSize(document.getElementById(state.htmlId).getBoundingClientRect().width, scale, zoomLevel, oldZoomLevel);
		var stateHeight = this.calculateSize(document.getElementById(state.htmlId).getBoundingClientRect().height, scale, zoomLevel, oldZoomLevel);
		var stateHeight2 = this.calculateSize(document.getElementById(state.htmlId).children[0].getBoundingClientRect().height, scale, zoomLevel, oldZoomLevel);
		var stateHeight3 = this.calculateSize(document.getElementById(state.htmlId).children[1].getBoundingClientRect().height, scale, zoomLevel, oldZoomLevel);
		var radius = this.calculateSize(GameEditor.getEditorController().jsPlumbInstance.selectEndpoints({element : state.htmlId}).get(0).endpoint.radius, scale, zoomLevel, oldZoomLevel);
		var fontSize = this.calculateSizeFont(parseInt(window.getComputedStyle(document.getElementById(state.htmlId).children[0].children[0]).fontSize.replace("px", "")), scale, zoomLevel, oldZoomLevel);

		//size
		document.getElementById(state.htmlId).style.width = stateWidth + "px";
		document.getElementById(state.htmlId).style.height = stateHeight + "px";

		//size child 0
		document.getElementById(state.htmlId).children[0].style.width = stateWidth + "px";
		document.getElementById(state.htmlId).children[0].style.height = stateHeight2 + "px";

		//size endpoints
		GameEditor.getEditorController().jsPlumbInstance.selectEndpoints({element : state.htmlId}).get(0).endpoint.radius=radius;

		//size font
		document.getElementById(state.htmlId).children[0].children[0].style.fontSize = fontSize + "px";

		//Handle start states and output states separately
		if(state.stateType === "START_STATE") {
			
		} else {
			//size child 1
			document.getElementById(state.htmlId).children[1].style.width = stateWidth + "px";
			document.getElementById(state.htmlId).children[1].style.height = stateHeight3 + "px";
			//size endpoints
			GameEditor.getEditorController().jsPlumbInstance.selectEndpoints({element : state.htmlId}).get(1).endpoint.radius=radius;
			//delete
			document.getElementById(state.htmlId+"delete").style.fontSize = fontSize + "px";
		}
	},

	scaleTransition : function(transition, scale, zoomLevel, oldZoomLevel) {
		//Calculate size
		var transitionWidth = this.calculateSize(document.getElementById(transition.htmlId).getBoundingClientRect().width, scale, zoomLevel, oldZoomLevel);
		var transitionHeight = this.calculateSize(document.getElementById(transition.htmlId).getBoundingClientRect().height, scale, zoomLevel, oldZoomLevel);
		var connection = GameEditor.getEditorController().jsPlumbInstance.getConnections({source: transition.connection.connectionFrom.htmlId, target : transition.connection.connectionTo.htmlId});
		var transitionFont = this.calculateSizeFont(parseInt(window.getComputedStyle(connection[0].getOverlay(transition.overlayId).canvas).fontSize.replace("px", "")), scale, zoomLevel, oldZoomLevel);
		//size
		document.getElementById(transition.htmlId).style.width = transitionWidth + "px";
		document.getElementById(transition.htmlId).style.height = transitionHeight + "px";
		//font
		connection[0].getOverlay(transition.overlayId).canvas.style.fontSize = transitionFont + "px";
		//delete
		document.getElementById(transition.overlayId+"_delete").style.fontSize = transitionFont + "px";
	},

	
		// var lowestX = 0;
		// var list = [];
		// lowestXList
		// this.stateList.forEach(function(state) {
		// 	if(parseInt(document.getElementById(state.htmlId).style.left.replace("px", "")) < lowestX) {
		// 		lowestX = parseInt(document.getElementById(state.htmlId).style.left.replace("px", ""));
		// 	}
		// 	list.push(parseInt(document.getElementById(state.htmlId).style.left.replace("px", "")));
		// }.bind(this));
		// this.transitionList.forEach(function(transition) {
		// 	if(parseInt(document.getElementById(transition.htmlId).style.left.replace("px", "")) < lowestX) {
		// 		lowestX = parseInt(document.getElementById(transition.htmlId).style.left.replace("px", ""));
		// 	}
		// 	list.push(parseInt(document.getElementById(transition.htmlId).style.left.replace("px", "")));
		// }.bind(this));

		// if(direction == 1) {
		// 	this.moveAllStatesByDelta(this.lowestXList.pop() * -1, 0);
		// } else {
		// 	if(lowestX < 0) {
		// 		this.moveAllStatesByDelta(lowestX * -1 + 250, 0);
		// 		this.lowestXList.push(lowestX * -1 + 250);
		// 	}
		// }
}