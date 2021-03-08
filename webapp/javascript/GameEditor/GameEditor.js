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

	handleMousemove(event) {
		if(!this.leftMouseDown) { clearTimeout(this.timer); return; }
		var edgeSize = 150;
		var viewportX = event.clientX - document.getElementById("container-wlcp-ui---gameEditor--toolbox").getBoundingClientRect().width;
		var viewportY = event.clientY - document.getElementById("__header0").getBoundingClientRect().height;
		//Logger.debug(viewportX + " " + viewportY);
		var viewportWidth = document.getElementById("container-wlcp-ui---gameEditor--pad").clientWidth;
		var viewportHeight = document.getElementById("container-wlcp-ui---gameEditor--pad").clientHeight;
		var edgeTop = edgeSize;
		var edgeLeft = edgeSize;
		var edgeBottom = ( viewportHeight - edgeSize );
		var edgeRight = ( viewportWidth - edgeSize );
		var isInLeftEdge = ( viewportX < edgeLeft );
		var isInRightEdge = ( viewportX > edgeRight );
		var isInTopEdge = ( viewportY < edgeTop );
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
	
				scrollHelper.timer = setTimeout( checkForWindowScroll, 30, scrollHelper );
	
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
			var maxStep = 50;
			if ( isInLeftEdge && canScrollLeft ) {
				var intensity = ( ( edgeLeft - viewportX ) / edgeSize );
				nextScrollX = ( nextScrollX - ( maxStep * intensity ) );
			} else if ( isInRightEdge && canScrollRight ) {
				var intensity = ( ( viewportX - edgeRight ) / edgeSize );
				nextScrollX = ( nextScrollX + ( maxStep * intensity ) );
			}
			if ( isInTopEdge && canScrollUp ) {
				var intensity = ( ( edgeTop - viewportY ) / edgeSize );
				nextScrollY = ( nextScrollY - ( maxStep * intensity ) );
			} else if ( isInBottomEdge && canScrollDown ) {
				var intensity = ( ( viewportY - edgeBottom ) / edgeSize );
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