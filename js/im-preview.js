function IMPreview($container, im){
	var imInstance = im;
	var payload;
	var payloadTemplate = '<div class="payloadData" hidden/>'
	var payloadHeader = '<h2>Available Data:</h2>'
	var $previewPane = $container;

	this.showPayloadData = function(payloadXML){
		payload = parsePayload(payloadXML.getElementsByTagName('data')[0]);
		$payloadContent = $(payloadTemplate).append(payloadHeader).append(payload);
		$previewPane.find('.payloadData').remove();
		$previewPane.append($payloadContent);
	}

	function parsePayload(payloadXML){
		var list = $('<ul>');
		testDoc = payloadXML;
		for (var i = 0; i < payloadXML.childNodes.length; i++){
			var node =  payloadXML.childNodes[i];
			if (node.nodeType == 1) {
				if (node.nodeName == 'field') {
					list = appendFieldListItem(list, node);
				} else {
					var listItem = $('<li>');
					listItem.append('<span>' + node.nodeName + ':</span>').append(parsePayload(node));	
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
		listItem.append('<span>' + node.getAttribute('name') + '</span> - ').append(createFieldUpdateLink(val));
		return list.append(listItem);
	}

	function createFieldUpdateLink(val){
		if (!val){
			return $('<span><em>Not supplied</em></span>');
		} else {
			updateLink = $('<span>').text(val);
			updateLink.click(function(){
				imInstance.updateLastActive(val);
			});
			return updateLink;
		}
	}

}