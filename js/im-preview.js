function IMPreview($container, im){
	var imInstance = im;
	var $mainContainer = $container;

	var previewTabs = {
		'payload' : 'payload',
		'preview' : 'preview'
	}

	var $previewPane;
	var tabManager;
	var pollSettings;

	var _this = this;
	
	this.init = function(){
		var $paneTemplate = $('<div class="previewPane closed"></div>');
		$mainContainer.append($paneTemplate);
		$previewPane = $('.previewPane', $mainContainer);
		tabManager = new TabManager($previewPane);
		//pollSettings = pollSettings
	}
	this.onReady = function(flowId, jobId, previewRequested){
		tabManager.emptyTabs();
		tabManager.addTab(previewTabs.payload);
		this.loadPayloadData(flowId);
		if (previewRequested === 'true') {
			tabManager.addTab(previewTabs.preview);
			this.loadMergePreview();
		}
	}

	this.loadPayloadData = function(flowId){
		var tmanager = tabManager;
		$.get('rhinoforms/data-document/' + flowId, function(data){
			tmanager.setContent(previewTabs.payload, _this.formatPayloadData(data.childNodes[0].getElementsByTagName('mmJob')[0]));
		});
	}

	this.formatPayloadData = function(payloadXML){
		var payload = parsePayload(payloadXML.getElementsByTagName('data')[0]);
		$payloadContent = $('<div class="payloadData"></div>').append(payload);
		return $payloadContent;
	}

	this.loadMergePreview = function(){
		tabManager.toggle(previewTabs.preview);
	}

	this.close = function(){
		tabManager.closePanel();
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
			updateLink = $('<span class="previewVal">').text(val);
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
				'name' : 'payload'
			},
			'preview' : {
				'text' : 'Merge Preview',
				'group' : 'merge',
				'name' : 'preview'
			}
		}
		var tabContainerSelector = '.tabs .tabContainer';
		var tabContentSelector = '.contents .previewContent';


		this.init = function(){
			$container.empty().append('<div class="tabs"></div><div class="contents"></div>')
		}

		this.emptyTabs = function(){
			$container.find('.tabs').empty();
			$container.find('.contents').empty();
		}

		this.addTab = function(tab){
			var tab = tabs[tab];
			var $tabTemplate = $('<div class="tabContainer"><h4 class="previewTab"><span class="tabText"></span><span class="toggle toggleOpen"/></h4></div>').data('group', tab.group);
			$tabTemplate.find('.tabText').text(tab.text);

			var $content = $('<div class="previewContent"></div>').data('group', tab.group);

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
					activeTab.active = true;
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
				if (!tabs[tab].active){
					this.switchTo(tab);
				} else {
					this.switchTo();
					this.closePanel();
				}
			} else {
				$container.addClass('open');
				if (tab){
					this.switchTo(tab);
				}
				this.openPanel();
			}
		}

		this.openPanel = function(){
			$container.addClass('open');
			$('.previewTab .toggle', $container).addClass('toggleClose');
			$mainContainer.addClass('show-preview');
		}

		this.closePanel = function(){
			$container.removeClass('open');
			$('.previewTab .toggle', $container).removeClass('toggleClose');
			$mainContainer.removeClass('show-preview');
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