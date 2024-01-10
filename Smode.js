/*

SMODE Chataigne Module

*/
var datas = {};
var payload = {};
function init() {
	local.scripts.getChild("Smode").enableLog.set(true);
	script.log("Initialize SMODE");
	datas.dataType = "json";
	datas.extraHeaders = "Content-Type: application/json";
	payload;
}

function moduleParameterChanged(param) {


}
function moduleValueChanged(value) {
	if (value.isParameter()) {
		script.log("Module value changed : " + value.name + " > " + value.get());
	} else {
		script.log("Module value triggered : " + value.name);
	}

	if (value.name == "onAIR") { onAir(value.get()); }
	else if (value.name == "output") { output(value.get()); }
	else if (value.name == "ecoMode") { ecoMode(value.get()); }
	else if (value.name == "refreshDevicesList") { refreshDevicesList(); }
}

function refreshDevicesList() {
	script.log("refresh Device List");
	var params = {};
	params.dataType = "json";
	params.extraHeaders = "Content-Type: application/json";
	local.sendGET("/api/live/devices", params); //the address field will be appended to the module's base address
}

function onAir(value) {
	payload.onAir = value;
	request("live/on-air/", value, "PATCH");
}

function output(value) {
	payload.output = value;
	request("live/output/", value, "PATCH");
}

function ecoMode(value) {
	payload.ecoMode = value;
	request("live/eco-mode/", value, "PATCH");
}

function request(path, value, method) {
	datas.payload = payload;
	if (method == "PATCH") {
		local.sendPATCH("/api/" + path, datas);
	}
}



