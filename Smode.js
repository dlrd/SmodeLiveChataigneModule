/*

SMODE Chataigne Module

*/
timerBetweenDataAndValues = 0;

var patchBody = {};
patchBody.dataType = "json";
patchBody.extraHeaders = "Content-Type: application/json";


function init() {
	local.parameters.debug.set(true);
}
function dataEvent(data, requestURL) {

	for (i = 0; i < data.length; i++) {
		local.values.contents.addContainer(data[i].label);
		container = local.values.contents.getChild(data[i].label);
		container.addStringParameter("uuid", "", data[i].uuid);
		container.addStringParameter("label", "", data[i].label);
		container.addColorParameter("color label", "", [data[i].colorLabel.red, data[i].colorLabel.green, data[i].colorLabel.blue]);
		container.addBoolParameter("loading", "", data[i].loading);

		/****************Process Parameter Banks*************** */
		for (b = 0; b < data[i].parameterBanks.length; b++) {
			bankName = (b + " " + data[i].parameterBanks[b].label);
			container.addContainer(bankName);
			parameterBanksContainer = container.getChild(bankName);

			exposedParameters = data[i].parameterBanks[b].parameters;
			//debug(exposedParameters.length);
			if (exposedParameters.length > 0) {
				debug(bankName + " have exposed Parameters");
				for (p = 0; p < exposedParameters.length; p++) {
					transposeParameter(exposedParameters[p], parameterBanksContainer);
				}
			}

		}
		local.values.contents.setCollapsed(false);
		container.setCollapsed(false);
	}

}

function transposeParameter(obj, container) {
	if (obj.class == "Color") {
		container.addColorParameter(obj.label, "", [0, 0, 0, 0]);
	} else if (obj.class == "Number") {
		container.addIntParameter(obj.label, "", obj);
	} else if (obj.class == "On/off option") {
		container.addBoolParameter(obj.label, "", obj);
	} else if (obj.class == "3D Position") {
		container.addPoint3DParameter(obj.label, "", obj);
	} else if (obj.class == "Percentage") {
		container.addFloatParameter(obj.label, "", obj, 0, 1);
	}
	else if (obj.class == "Percentage (-100% - 100%)") {
		container.addFloatParameter(obj.label, "", obj, -1, 1);
	}
	else if (obj.class == "Angle (0 - 360 deg)") {
		container.addFloatParameter(obj.label, "", obj, 0, 360);
	}
	else if (obj.class == "Positive Number") {
		container.addIntParameter(obj.label, "", obj, 0);
	} else if ((obj.class == "2D Position") || (obj.class == "2D Size in Unbounded Percentage")) {
		container.addPoint2DParameter(obj.label, "", obj);
	}
	else {
		container.addStringParameter(obj.label, " ", "unknown parameter type:" + obj.class);
		//container.getChild(obj.label).setAttribute("enabled", false);
	}
}

function moduleParameterChanged(param) {
	if (param.name == "update") {
		timerBetweenDataAndValues = 0;
		//local.parameters.autoAdd.set(true);
		local.values.removeContainer("contents");
		local.values.addContainer("contents");
		local.sendGET("/api/live/contents/");

		//local.parameters.autoAdd.set(false);
		local.values.setCollapsed(false);
	}
	if (param.name == "clearValues") {
		local.values.setCollapsed(true);

	}
}

function moduleValueChanged(value) {
	if ((timerBetweenDataAndValues > 25)) {
		uid = JSON.stringify(getUid(value));
		var variablePath = value.name;
		var request = "/api/live/objects/" + getUid(value) + "?variablePath=" + variablePath; ///api/live/objects/00000000-0000-4000-8000-000000000001?variablePath=configuration.autoSave.enable
		patch(request, value);
	}
}
function patch(request, value) {
	//debug("Patch Function:");
	patchBody.payload = { value: value.get() };
	//debug(request);
	//debug("value:" + value.get());
	local.sendPATCH(request, patchBody);
}

function getUid(obj) {
	p = obj.getParent();
	if (doesExist(p.uuid)) {
		return (p.uuid.get());
	} else {
		return (getUid(p));
	}
}

function parentToCall(obj) {
	p = obj.getParent();
	if (doesExist(p)) {
		return (p);
	} else {
		return (getUid(p));
	}
}

function doesExist(obj) {
	if (obj == "undefined") {
		return false;
	}
	else {
		return true;
	}
}

function update(deltaTime) {
	timerBetweenDataAndValues += 1;

}

function debug(mess) {
	if (local.parameters.debug.get()) {
		script.log("Debugging: 	" + mess);
	}

}