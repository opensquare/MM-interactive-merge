function IMPreview($container, im){
	var imInstance = im;
	var payload;
	var payloadTemplate = '<div class="payloadData" />'
	var payloadHeader = '';
	var $mainContainer = $container;
	var $previewPane;
	var paneTemplate = '<div class="previewPane closed"><h4 class="previewTab">Data<span id="toggle" class="toggleOpen"/></h4></div>';

	this.init = function(){
		var $paneTemplate = $(paneTemplate);
		var _this = this;
		$('.previewTab', $paneTemplate).click(function(){
			_this.toggle();
		});
		$mainContainer.append($paneTemplate);
		$previewPane = $('.previewPane', $mainContainer);
	}
	this.loadPayloadData = function(flowId){
		var _this = this;
		$.get('rhinoforms/data-document/' + flowId, function(data){
			_this.showPayloadData(data.childNodes[0].getElementsByTagName('mmJob')[0]);
		})
	}
	this.showPayloadData = function(payloadXML){
		this.close();
		payload = parsePayload(payloadXML.getElementsByTagName('data')[0]);
		$payloadContent = $(payloadTemplate).append(payloadHeader).append(payload).addClass('active');
		$previewPane.find('.payloadData').remove();
		$previewPane.append($payloadContent);
	}

	this.close = function(){
		$previewPane.removeClass('open');
		$('.previewTab span', $previewPane).removeClass('toggleClose');
		$mainContainer.removeClass('show-preview');
		return this;
	}

	this.open = function(){
		$previewPane.addClass('open');
		$('.previewTab span', $previewPane).addClass('toggleClose');
		$mainContainer.addClass('show-preview');
		return this;
	}

	this.toggle = function(){
		if($previewPane.hasClass('open')){
			this.close();
		} else {	
			this.open();
		}
		return this;
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

	this.init();

}