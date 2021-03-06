function IMPreview($container, im){
	var imInstance = im;
	var $mainContainer = $container;

	var previewTabs = {
		'payload' : 'payload',
		'preview' : 'preview'
	}

	var $previewPane;
	var tabManager;
	var pollInterval;
	var outputUrl;

	var _this = this;
	
	this.init = function(){
		var $paneTemplate = $('<div class="preview-pane closed"></div>');
		$mainContainer.append($paneTemplate);
		$previewPane = $('.preview-pane', $mainContainer);
		tabManager = new TabManager($previewPane);
	}
	this.onReady = function(flowId, jobId, settings){
		tabManager.emptyTabs();
		if (settings.showData == 'true'){
			tabManager.addTab(previewTabs.payload);
			this.loadPayloadData(flowId);
		}
		if (settings.previewRequested === 'true') {
			outputUrl =  $(settings.outputProxy).attr('rf.source') + '?rf.flowId=' + flowId;
			tabManager.addTab(previewTabs.preview);
			this.loadMergePreview(settings, flowId);
		}
		imInstance.inputActive = this.inputActive;
	}

	this.loadPayloadData = function(flowId){
		var tmanager = tabManager;
		$.get('rhinoforms/data-document/' + flowId, function(data){
			tmanager.setContent(previewTabs.payload, _this.formatPayloadData(data.childNodes[0].getElementsByTagName('mmJob')[0]));
		});
	}

	this.formatPayloadData = function(payloadXML){
		var payload = parsePayload(payloadXML.getElementsByTagName('data')[0]);
		$payloadContent = $('<div class="payload-data"></div>').append(payload);
		return $payloadContent;
	}

	this.inputActive = function(){
		tabManager.switchTo(previewTabs.payload);
	}

	this.loadMergePreview = function(settings, flowId){
		tabManager.setContent(previewTabs.preview, '<h3 class="loading" style="margin:auto;width:20%">Previewing Merge...</h3>');
		tabManager.toggle(previewTabs.preview);
		out(settings.previewResponse.substr(29));
		if (checkPreviewJobId(settings.previewResponse.substr(29))){
			pollForMerge(settings,flowId, checkJobMerged);
		} else {
			pollFailed({}, {}, settings.previewResponse);
		}
	}

	this.close = function(){
		tabManager.closePanel();
	}

	function checkPreviewJobId(id){
		return !isNaN(parseInt(id)) && isFinite(id);
	}

	function checkJobMerged(data, textStatus, jqXHR){
		if (jqXHR.status == 200){
			switch (data.status){
				case 'FINISHED_SUCCESSFULLY':
					displayMergedOutput();
					clearInterval(pollInterval);
					break;
				case 'FINISHED_WITH_ERRORS':
					displayMergedOutput(data.errorMessage);
					clearInterval(pollInterval);
					break;
				case 'DELETED':
					displayJobDeleted();
					clearInterval(pollInterval);
					break;
			}
		} else {
			pollFailed();
		}
		
	}

	function displayMergedOutput(error){
		var content='';
		if(error){
			content='<p>Preview completed with errors: ' + error + '</p>';
		} else {
			content = '<iframe style="height:100%;width:100%" src="' + outputUrl + '" ></iframe>';
		}
		tabManager.setContent(previewTabs.preview, content);
	}

	function displayJobDeleted(){
		tabManager.setContent(previewTabs.preview, '<p>The preview has been deleted from the job queue. Please try again</p>');
	}

	function pollForMerge(settings, flowId) {
		var url = $(settings.jobsProxy).attr('rf.source') + '?rf.flowId=' + flowId;
		var interval = settings.pollInterval;
		
		var $loadText = $previewPane.find('.contents h3.loading');
		var loadTextLength = $loadText.text().length;
		setInterval(function(){
			var textLength = $loadText.text().length;
			if (textLength >= loadTextLength){
				$loadText.text($loadText.text().substr(0, loadTextLength - 3));
			} else {
				$loadText.text($loadText.text() + '.');
			}
		}, 400);

		$.getJSON(url, checkJobMerged).fail(pollFailed);
		var maxRequests = isNaN(settings.maxPreviewPollRequests) ? 200 : settings.maxPreviewPollRequests;
		var requests = 0;
		
		pollInterval =  setInterval(function(){
			requests += 1;
			if (requests >= maxRequests){
				clearInterval(pollInterval);
				tabManager.setContent(previewTabs.preview, '<p>Waiting for preview has exceeded maximum limit. Check status of merge instances to ensure documents are being merged</p>');
			} else {
				$.getJSON(url, checkJobMerged).fail(pollFailed);
			}
		}, 1000 * interval);
	}

	function pollFailed(jqXHR, textStatus, errorThrown){
		console.debug('Error getting job details. Polling for preview halted');
		clearInterval(pollInterval);
		tabManager.setContent(previewTabs.preview, '<p>Problem encountered whist waiting for preview:<pre>'+ errorThrown +'</pre></p>');
	}

	function parsePayload(payloadXML, sub){
		var list = $('<ul>');
		if (sub) list.addClass('sub');
		testDoc = payloadXML;
		for (var i = 0; i < payloadXML.childNodes.length; i++){
			var node =  payloadXML.childNodes[i];
			if (node.nodeType == 1) {
				if (node.nodeName == 'field') {
					list = appendFieldListItem(list, node);
				} else {
					var listItem = $('<li>');
					var subName = node.getAttribute('name') != null ? ' - ' + node.getAttribute('name') : '';
					listItem.append('<span><strong>' + node.nodeName + '</strong>:' + subName + '</span>').append(parsePayload(node, true));
					list.append(listItem);
				}
				
			}
		}
		return list;
	}

	function appendFieldListItem(list, node){
		// determine if field has text
		var val = (node.childNodes[0]) ? node.childNodes[0].nodeValue : '';
		// append and return list
		var listItem = $('<li/>');
		var fieldPostfix = node.getAttribute('name').substring(node.getAttribute('name').lastIndexOf('.'));
		var fieldName = fieldPostfix.substr(0,1) == '.' ? fieldPostfix : node.getAttribute('name');
		listItem.append('<span title="' + node.getAttribute('name') + '">' + fieldName + '</span> - ').append(createFieldUpdateLink(val));
		return list.append(listItem);
	}

	function createFieldUpdateLink(val){
		if (!val){
			return $('<span><em>Not supplied</em></span>');
		} else {
			updateLink = $('<span class="preview-val">').text(val);
			updateLink.click(function(){
				imInstance.updateLastActive(val);
			});
			return updateLink;
		}
	}

	function out(s){
		console.debug(s);
	}

	this.init();

	function TabManager(container){
		var _this = this;
		var $container = container;
		var tabs = {
			'payload' : {
				'text': 'Data',
				'group' : 'payload',
				'name' : 'payload',
				'onShow' : function(){
					$mainContainer.addClass('show-preview');
				},
				'onHide' : function(){
					$mainContainer.removeClass('show-preview');
				}
			},
			'preview' : {
				'text' : 'Merge Preview',
				'group' : 'merge',
				'name' : 'preview',
				'onShow' : function(){
					$mainContainer.removeClass('show-preview');
				},
				'onHide' : function(){}
			}
		}
		var tabContainerSelector = '.tabs .tab-container';
		var tabContentSelector = '.contents .preview-content';


		this.init = function(){
			$container.empty().append('<div class="toggle-bar">&nbsp;</div><div class="tabs"></div><div class="contents"></div>');
			$container.find('.toggle-bar').click(function(){
				var activeTab = getActiveTab();
				if (!activeTab){
					_this.toggle(tabs.payload.name);
				} else {
					_this.toggle(activeTab);
				}
			})
		}

		this.emptyTabs = function(){
			$container.find('.tabs').empty();
			$container.find('.contents').empty();
		}

		this.addTab = function(tab){
			var tab = tabs[tab];
			var $tabTemplate = $('<div class="tab-container"><h4 class="preview-tab"><span class="tab-text"></span><span class="toggle toggle-open"/></h4></div>').data('group', tab.group);
			$tabTemplate.find('.tab-text').text(tab.text);

			var $content = $('<div class="preview-content"></div>').data('group', tab.group);

			$tabTemplate.click(function(){
				_this.toggle(tab.name);
			});
			
			$container.find('.tabs').append($tabTemplate);
			$container.find('.contents').append($content);
		}

		this.setContent = function(tab, content){
			findTabPart(tabs[tab].group, tabContentSelector).empty().append(content);
		}

		this.switchTo = function(tab){
			var activeTab = tabs[tab];
			for (var t in tabs) {
				if (activeTab && t == activeTab.name){
					$container.addClass(activeTab.group);
					findTabPart(activeTab.group, tabContainerSelector).addClass('active');
					findTabPart(activeTab.group, tabContentSelector).addClass('active');
					tabs[tab].active = true;
				} else {
					$container.removeClass(tabs[t].group);
					findTabPart(tabs[t].group, tabContainerSelector).removeClass('active');
					findTabPart(tabs[t].group, tabContentSelector).removeClass('active');
					tabs[t].active = false;
				} 
				
			}
		}

		this.toggle = function(tab){
			if($container.hasClass('open')){
				if (tab && !tabs[tab].active){
					this.switchTo(tab);
					tabs[tab].onShow();
				} else {
					this.closePanel();
					for (var t in tabs){
						tabs[t].onHide();
					}
				}
			} else {
				$container.addClass('open');
				if (tab){
					this.switchTo(tab);
					tabs[tab].onShow();
				} else {
					var activeTab = getActiveTab();
					if (activeTab){
						this.switchTo(activeTab);
						tabs[activeTab].onShow();
					}
				}
				this.openPanel();
			}
		}

		function getActiveTab(){
			for (var t in tabs){
				if (tabs[t].active){
					return t;
				}
			}
			return false;
		}

		this.openPanel = function(){
			$container.addClass('open');
			$('.preview-tab .toggle', $container).addClass('toggle-close');

		}

		this.closePanel = function(){
			$container.removeClass('open');
			$('.preview-tab .toggle', $container).removeClass('toggle-close');
		}

		function findTabPart(group, selector){
			var $contents = $container.find(selector);
			var group = group;
			var content = $();
			$contents.each(function(){
				if ($(this).data('group') === group){
					content = $(this);
					return;
				}
			});
			return content;
		}
		this.init();
	}

}