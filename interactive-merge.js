function Widget_MM_interactive_merge() {

	var _this = this;
	
	var invalidJobMessage = 
		'<h2>Unable to initialise Interactive Merge</h2>\n\
		<p>A valid job ID has not been specified</p>';
	
	this.onReadyExtend = function(){
		/*var hashtag = window.location.hash;
		console.debug('hashtag: ' + hashtag);
		if (isValidId(hashtag)) {
			hashtag = hashtag.substr(1);
			var container = $('.rhinoforms-merge-container', this.$widgetDiv);
			initIM(hashtag, container);
		} else {
			this.setContent(invalidJobMessage);
		}*/
	}
	
	function isValidId(str){
		var pattern = /^#[0-9]+$/g;
		return str.length > 1 && pattern.test(str);
	}

	
	function initIM(id, $container){
		loadMergeFlow(id, $container);
	}

	function loadMergeFlow(id, $container){
		var initialData = '<merge><jobId>' + id + '</jobId></merge>';
		var flow = 'widgets/MM-interactive-merge/merge-flow.js';
		rf.loadFlow(flow, $container, initialData);
	}

}