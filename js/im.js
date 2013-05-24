function InteractiveMerge(){
	
	var controls,
	rtEditors,
	lastActiveInput;

	var rteManager = new RTEManager();

	this.init = function(){
		controls = [
			"text",
			"richText",
			"boolean",
			"number",
			"dateTime",
			"email",
			"file",
		],
		rtEditors = [];
	}

	this.onReady = function(){
		// initialise CKEditor RTE for each IM textarea field
		this.loadRTEs();
	}
	
	this.createControl = function($container, fieldData){

		var field = verifyFieldData(fieldData, $container);

		if(field != null){

			var controlParts = controlBuilder().build(field);
			for (var i = 0; i<= controlParts.length; i++){
				$container.append(controlParts[i]);
			}
		}
	}

	this.updateRTEFields = function(){
		while(field = rtEditors.pop()){
			rteManager.updateIMField(field.editorName);
			// trigger change event to update rf field
			$('textarea[name="' + field.name + '"]').change();
		}
	}

	this.loadRTEs = function(){
		for (var i = 0; i < rtEditors.length; i++){
			rteManager.loadRTE(rtEditors[i].editorName);
		}
	}

	this.updateLastActive = function(value) {
		if(lastActiveInput){
			lastActiveInput.val(value).change();
		}
	}

	// private methods 

	var verifyFieldData = function(fieldData, $container){
		var field = {};
		
		if (fieldData.hasOwnProperty('name') && fieldData.name != '') {
			field.name = fieldData.name;
			field.id = (field.name).replace(/\./g, '_');
		} else {
			$container.html('<span>Bad field data. Field name not supplied</span>');
			return null;
		}
		
		if (fieldData.hasOwnProperty('label') && fieldData.label != '') {
			field.label = fieldData.label;
		} else {
			$container.html('<span>Bad field data. Field label not supplied for field ' + field.name + '</span>');
			return null;
		}
		
		field.inputType = (fieldData.hasOwnProperty('type')) ? fieldData.type : "text";
		field.value = (fieldData.hasOwnProperty('value')) ? fieldData.value : "";
		field.mandatory = fieldData.mandatory == 'true';
		
		return field;
	}

	// delegates to control specific builder methods based on type of field
	var controlBuilder = function() {
		var build = function(field){
			switch (field.inputType) {
				case "text":
					return new textControl(field);
					break;
				case "boolean":
					return new booleanControl(field);
					break;
				case "email":
					return new emailControl(field);
					break;
				case "number":
					return new numberControl(field);
					break;
				case "richText":
					return new richTextControl(field);
					break;
				default:
					return new textControl(field);
			}
		}
		return {build : build};
	}

	var createLabel = function(value, inputId) {
		if (inputId){
			return $('<label>').attr("for", inputId).text(value);
		} else {
			return $('<label>').text(value);
		}
	}

	var createSimpleInput = function(field, type, rfValidationKeyword){
		// construct input
		var $input = $('<input type="' + type + '">').attr('name', field.name).attr('id',field.id).val(field.value);
		
		// apply validation
		var rfValidation = [];
		if (rfValidationKeyword){
			rfValidation.push(rfValidationKeyword);
		}
		if(field.mandatory){
			rfValidation.push("required");
		}
		var rfValidationString = rfValidation.toString().replace(',', ' ');
		$input.attr("rf.validation", rfValidationString);

		// bind change to equivalent rhinoforms hidden field
		$input.change(function(){
			var rfName = field.name.replace('.im', '');
			$('input[name="'+ rfName + '"]').val($(this).val());
		});
		$input.focus(function(){
			lastActiveInput = $(this);
		})

		return $input;
	}

	var textControl = function(field){
		var $label = createLabel(field.label, field.id);
		var $input = createSimpleInput(field, "text");

		return [$label, $input];
	}

	var booleanControl = function(field){
		// default values for check boxes
		var booleanTrue = "Yes",
		booleanFalse = "No";
		
		var $label = createLabel(field.label);
		var $input = $('<input type="checkbox">').attr('name', field.name).attr('id',field.id).val(booleanTrue);
		if (field.value == booleanTrue){
			$input.prop("checked", true);
		}
		// bind input to rhinoforms hidden input
		$input.change(function(){
			var rfName = field.name.replace('.im', '');
			var $rfInput = $('input[name="'+ rfName + '"]');
			if ($(this).is(':checked')){
				$rfInput.val($(this).val());
			} else {
				$rfInput.val(booleanFalse);
			}
		});
		var $inputLabel = createLabel(booleanTrue, field.id);
		return [$label, $input, $inputLabel];
	}

	var emailControl = function(field){
		var $label = createLabel(field.label, field.id);
		var $input = createSimpleInput(field, "email", "email");
		
		return [$label, $input];
	}

	var numberControl = function(field){
		var $label = createLabel(field.label, field.id);
		var $input = createSimpleInput(field, "number", "pattern({regex:'^[0-9\\.]+$'})");
		
		return [$label, $input];
	}

	var richTextControl = function(field){
		var $label = createLabel(field.label, field.id);
		var $textarea = $('<textarea></textarea>').attr('name', field.name).attr('id', field.id).val(field.value);

		// add some useful parameters to retrieve and update the associated rf field and rtEditor 
		field.editorName = rteManager.getRTEName(field.id);
		field.rfName = field.name.replace('.im', '');

		$textarea.change(function(){
			$('input[name="'+ field.rfName + '"]').val($(this).val().replace(/(\r\n|\n|\r)/gm,""));
		})

		// add to rtEditor field list ready for load
		rtEditors.push(field);

		return [$label, $textarea];
	}

	function RTEManager(){
		// keep RTE implementation separate

		this.getRTEName = function(IMFieldId) {
			return IMFieldId.replace('.', '_');
		}

		this.loadRTE = function(fieldName) {
			var editor = CKEDITOR.replace(fieldName);
			editor.on('focus', function(e){
				lastActiveInput = null;
			})
		}

		this.updateIMField = function(fieldName){
			CKEDITOR.instances[fieldName].updateElement();
		}


		this.unload = function(fieldName){
			CKEDITOR.instances[fieldName].destroy();
		}
	}

	this.init();
};

// rf.validationFunction called by hidden rf inputs
function validateMergeField(field, mandatory, type){
	if (mandatory == 'true'){
		field.validate('required');
	}
	if (type == 'email'){
		field.validate('email');
	}
	if (type == 'number'){
		field.validate("pattern({regex:'^[0-9\\.]+$'})");
	}
}