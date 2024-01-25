/*

SMODE Chataigne Module

*/
timerBetweenDataAndValues = 0;

var patchBody = {};
patchBody.dataType = "json";
patchBody.extraHeaders = "Content-Type: application/json";

var smodeParameters = [];
var smodeMarkers = [];

function init() {
	local.parameters.debug.set(true);

}
function dataEvent(data, requestURL) {

	for (i = 0; i < data.length; i++) {
		container = local.values.contents.addContainer(data[i].label);

		sceneId = container.addStringParameter("uuid", "", data[i].uuid);
		sceneId.setAttribute("enabled", false);
		sceneActivation = container.addBoolParameter("activation", "", data[i].activation);
		sceneLoading = container.addBoolParameter("loading", "", data[i].loading);

		addEntryInParameters(sceneLoading, data[i].class, data[i].uuid, "loading");
		addEntryInParameters(sceneActivation, data[i].class, data[i].uuid, "activation");

		/****************Process Parameter Banks*************** */
		for (b = 0; b < data[i].parameterBanks.length; b++) {
			bankName = (b + " " + data[i].parameterBanks[b].label);
			container.addContainer(bankName);
			parameterBanksContainer = container.getChild(bankName);

			exposedParameters = data[i].parameterBanks[b].parameters;

			if (exposedParameters.length > 0) {
				for (p = 0; p < exposedParameters.length; p++) {
					transposeParameter(exposedParameters[p], parameterBanksContainer);
				}
			}
		}

		/**************************Process Main Timelines	********* */
		if ((data[i].label != "Show") && (data[i].animationUuid != "00000000-0000-0000-0000-000000000000")) {
			timeline = container.addContainer("Main Timeline");
			play = timeline.addBoolParameter("Play", "", false);
			playMode = timeline.addEnumParameter("Play Mode", 0, "forward", 1, "backward", 2, "Ping Pong", 3, "Reverse Ping Pong"); // Fix Me: do not works because of index problems...

			addEntryInParameters(play, "Trigger", data[i].animationUuid, "transport.playing");
			addEntryInParameters(playMode, "Cue Play Mode", data[i].animationUuid, "parameters.playMode");

			actionsArray = data[i].actions;

			for (j = 0; j < actionsArray.length; j++) {
				debug(actionsArray[j].class);
				if (actionsArray[j].class == "TimeMarker") {
					gotoMarker = timeline.addTrigger("Goto" + actionsArray[j].label, actionsArray[j].uuid);
					addEntryInMarkers(gotoMarker, actionsArray[j].class, data[i].animationUuid, actionsArray[j].uuid);
				}
			}

		}
		local.values.contents.setCollapsed(false);
		container.setCollapsed(false);
	}

}

function transposeParameter(obj, container) {
	var v;

	if (obj.class == "Color") {
		v = container.addColorParameter(obj.label, "", [0, 0, 0, 0]);
	} else if (obj.class == "Number") {
		v = container.addIntParameter(obj.label, "", obj.value);
	} else if (obj.class == "On/off option") {
		v = container.addBoolParameter(obj.label, "", obj);
	} else if (obj.class == "3D Position") {
		v = container.addPoint3DParameter(obj.label, "", obj);
	} else if (obj.class == "Percentage") {
		v = container.addFloatParameter(obj.label, "", obj.value, 0, 1);
	}
	else if (obj.class == "Percentage (-100% - 100%)") {
		v = container.addFloatParameter(obj.label, "", obj, -1, 1);
	}
	else if (obj.class == "Multi-line Text") {
		v = container.addStringParameter(obj.label, "", obj.value);
	}
	else if (obj.class == "Positive Number") {
		v = container.addIntParameter(obj.label, "", obj, 0);
	} else if ((obj.class == "2D Position") || (obj.class == "2D Size in Unbounded Percentage")) {
		v = container.addPoint2DParameter(obj.label, "", obj);
	}
	else {
		v = container.addStringParameter(obj.label.replace(" ", ""), " ", "unknown parameter type:" + obj.class);
		v.setAttribute("enabled", false);

	}
	addEntryInParameters(v, obj.class, obj.uuid, "value");
}

function addEntryInParameters(v, cl, id, path) {
	smodeParameters.push({ chataigneValue: v, smodeClass: cl, apiPath: path, smodeUuid: id });
	//debug(smodeParameters.length);
}

function addEntryInMarkers(v, cl, timelineId, id) {
	smodeMarkers.push({ chataigneValue: v, smodeClass: cl, timelineId: timelineId, markerId: id });
}

function moduleParameterChanged(param) {
	if (param.name == "update") {
		timerBetweenDataAndValues = 0;

		local.values.removeContainer("contents");
		local.values.addContainer("contents");
		local.sendGET("/api/live/contents/");
		smodeParameters = [{ chataigneValue: "" }, { smodeClass: "" }];
		local.values.setCollapsed(false);
	}
}

function moduleValueChanged(value) {
	if ((timerBetweenDataAndValues > 25)) {
		uid = "";
		var variablePath = value.name;
		var request = "";

		for (i = 0; i < smodeParameters.length; i++) {
			if (value == smodeParameters[i].chataigneValue) {
				debug("calling a Smode object of type: " + smodeParameters[i].smodeClass);
				uid = smodeParameters[i].smodeUuid;
				variablePath = smodeParameters[i].apiPath;
				request = "/api/live/objects/" + uid + "?variablePath=" + variablePath;

				if (smodeParameters[i].smodeClass == "Color") {
					patchColor(request, value);
				} else {
					patch(request, value);
				}
			}
		}

		for (i = 0; i < smodeMarkers.length; i++) {
			if (value == smodeMarkers[i].chataigneValue) {
				debug("calling a Smode maker: " + smodeMarkers[i].smodeClass);
				request = "/api/live/animations/" + smodeMarkers[i].markerId + "/move";
				debug(request);
				post(request, value);
			}
		}
	}
}

function patchColor(request, value) {
	baseReq = request + ".red";
	patchBody.payload = { value: value.get()[0] };
	local.sendPATCH(baseReq, patchBody);
	baseReq = request + ".green";
	patchBody.payload = { value: value.get()[1] };
	local.sendPATCH(baseReq, patchBody);
	baseReq = request + ".blue";
	patchBody.payload = { value: value.get()[2] };
	local.sendPATCH(baseReq, patchBody);
	baseReq = request + ".alpha";
	patchBody.payload = { value: value.get()[3] };
	local.sendPATCH(baseReq, patchBody);
}
function patch(request, value) {
	patchBody.payload = { value: value.get() };
	local.sendPATCH(request, patchBody);
}

function post(request, value) {
	local.sendPOST(request);
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
