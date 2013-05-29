function InteractiveMerge(IMcontainer, flow){
	
	var controls,
	rtEditors,
	lastActiveInput;

	var rteManager = new RTEManager();

	var invalidJobMessage = '<h2>Unable to initialise Interactive Merge</h2>\n\
		<p>A valid job ID has not been specified</p>';

	var flow = flow;
	var flowLoaded = false;
	var imContainer = $(IMcontainer);

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

		if (!flowLoaded){
			var hashtag = window.location.hash;
			console.debug('hashtag: ' + hashtag);
			if (isValidId(hashtag)) {
				hashtag = hashtag.substr(1);
				loadMergeFlow(hashtag, imContainer);
			} else {
				imContainer.html(invalidJobMessage);
			}
			flowLoaded = true;
		}
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
	function isValidId(str){
		var pattern = /^#[0-9]+$/g;
		return str.length > 1 && pattern.test(str);
	}

	function loadMergeFlow(id, $container){
		var initialData = '<merge><jobId>' + id + '</jobId></merge>';
		rf.loadFlow(flow, $container, initialData);
	}

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
				case "dateTime":
					return new dateTimeControl(field);
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

	var createSimpleInput = function(field, type, rfValidationKeyword, skipInputBind){
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
		if (!skipInputBind){
			$input.change(function(){
				var rfName = field.name.replace('.im', '');
				$('input[name="'+ rfName + '"]').val($(this).val());
			});
		}
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

	var dateTimeControl = function(field){
		// get date and time values as array
		var val = parseDateTimeValue(field.value);

		// clone field object for date and time inputs
		var dateField = $.extend({}, {}, field);
		dateField.name += '-date';
		dateField.id += '-date';
		dateField.value = val[0];
		var timeField = $.extend({}, {}, field);
		timeField.name += '-time';
		timeField.id += '-time';
		timeField.value = val[1];

		// create controls
		var $label = createLabel(field.label, field.id);
		
		var $dateInput = createSimpleInput(dateField, "date", "date({format:'YYYY-MM-DD'})", true);
		var $timeInput = createSimpleInput(timeField, "text", "date({format:'HH:mm:ss'})", true).addClass('time');
		var callback = function(){
			var rfName = field.name.replace('.im', '');
			$('input[name="'+ rfName + '"]').val($dateInput.val() + 'T' + $timeInput.val());
		}
		$dateInput.change(callback);
		$timeInput.change(callback);
		return [$label, $dateInput, $timeInput];
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

	function parseDateTimeValue(value){
		var dateTimeVal = parseDate(value);
		var dateVal = '';
		var timeVal = '';
		if (dateTimeVal != ''){
			dateVal = dateTimeVal.format('YYYY-MM-DD');
			timeVal = dateTimeVal.format('HH:mm:ss');
		}
		return [dateVal, timeVal];
	}

	function parseDate(value){
		var ISOpattern = /\d\d\d\d-[0-1]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/g;
		var defaultDateTimePattern = /[0-3]\d\/[0-1]\d\/\d\d\d\d\w[0-2]\d:[0-5]\d:[0-5]\d/g;
		var defaultDatePattern = /[0-3]\d\/[0-1]\d\/\d\d\d\d/g;
		if (value.match(ISOpattern)){
			return new moment(value, 'YYYY-MM-DDTHH:mm:ss');
		}
		if (value.match(defaultDateTimePattern)){
			return new moment(value, 'DD/MM/YYYY HH:mm:ss');
		}
		if (value.match(defaultDatePattern)){
			return new moment(value, 'DD/MM/YYYY');
		}
		// no matches, don't use payload value
		return '';
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
	if (type == 'dateTime'){
		field.validate("pattern({regex:'^[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$'})");
	}
}