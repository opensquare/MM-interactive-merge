function IMPreview($container, im){
	var imInstance = im;
	var payload;
	var payloadHeader = '';
	var $mainContainer = $container;
	var $previewPane;
	var _this = this;
	var tabs = {
		'payload' : {
			'text': 'Data',
			'group' : 'payload'
		},
		'preview' : {
			'text' : 'Merge Preview',
			'group' : 'merge'
		}
	}
	
	this.init = function(){
		var $paneTemplate = $('<div class="previewPane closed"><div class="tabs"></div><div class="contents"></div></div>');
		$mainContainer.append($paneTemplate);
		$previewPane = $('.previewPane', $mainContainer);
	}
	this.onReady = function(flowId, jobId, previewRequested){
		reloadTabs(previewRequested);
		this.loadPayloadData(flowId);
		if (previewRequested === 'true') {
			addTab(tabs.preview);
			this.showMergePreview();
		}
	}
	function reloadTabs(){
		$previewPane.find('.tabs').empty();
		$previewPane.find('.contents').empty();
		addTab(tabs.payload);
	}
	
	function addTab(tab){
		var $tabTemplate = $('<div class="tabContainer"><h4 class="previewTab"><span class="tabText"></span><span class="toggle toggleOpen"/></h4></div>');
		$tabTemplate.data('group', tab.group);
		$tabTemplate.find('.tabText').text(tab.text);
		$tabTemplate.click(function(){
			_this.toggle(this);
		});
		var $content = $('<div class="previewContent"></div>').data('group', tab.group);
		$previewPane.find('.tabs').append($tabTemplate);
		$previewPane.find('.contents').append($content);
	}

	this.loadPayloadData = function(flowId){
		$.get('rhinoforms/data-document/' + flowId, function(data){
			_this.insertPayloadData(data.childNodes[0].getElementsByTagName('mmJob')[0]);
		});
	}
	this.insertPayloadData = function(payloadXML){
		payload = parsePayload(payloadXML.getElementsByTagName('data')[0]);
		$payloadContent = $('<div class="payloadData"></div>').append(payloadHeader).append(payload);
		var $tabContent = findContent(tabs.payload.group, '.contents .previewContent');
		$tabContent.find('.payloadData').remove();
		$tabContent.append($payloadContent);
	}

	this.showMergePreview = function(){
		findContent(tabs.preview.group, '.tabContainer').click();
	}

	this.close = function(){
		$previewPane.removeClass('open');
		$('.previewTab .toggle', $previewPane).removeClass('toggleClose');
		$('.tabContainer.active, ', $previewPane).removeClass('active');
		$('.contents .previewContent.active, ', $previewPane).removeClass('active');
		$mainContainer.removeClass('show-preview');
		return this;
	}

	this.open = function(){
		$previewPane.addClass('open');
		$('.previewTab .toggle', $previewPane).addClass('toggleClose');
		$mainContainer.addClass('show-preview');
		return this;
	}

	this.toggle = function(tabContainer){
		for (var tab in tabs) {
			$previewPane.removeClass(tabs[tab].group);
		}
		if($previewPane.hasClass('open')){
			if (tabContainer && !$(tabContainer).hasClass('active')){
				switchTab(tabContainer, tabs);
			} else {
				this.close();
			}
		} else {
			if(tabContainer){
				switchTab(tabContainer,tabs);

			}
			this.open();
		}
		return this;
	}

	function switchTab(tabContainer, tabs){
		out(tabs);
		var tabGroup = $(tabContainer).data('group');
		$('.tabContainer.active, ', $previewPane).removeClass('active');
		$('.contents .previewContent.active, ', $previewPane).removeClass('active');
		findContent(tabGroup,'.contents .previewContent').addClass('active');
		findContent(tabGroup,'.tabContainer').addClass('active');
		$previewPane.addClass(tabGroup);

	}

	function findContent(group, selector){
		var $contents = $previewPane.find(selector);
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

}