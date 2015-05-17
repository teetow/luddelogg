isToday = function(datacontext) {
	var now = moment(Session.get("now"));
	var rowMidnight = moment(datacontext.date, "YYYY-MM-DD");
	var lowerBoundTime = moment(rowMidnight + datacontext.chartdata.lowerBound);
	var upperBoundTime = moment(rowMidnight + datacontext.chartdata.upperBound);
	if (now >= lowerBoundTime && now <= upperBoundTime) {
		return true;
	}
};
makeDuration = function(timestamp) {
	var duration = moment.duration(timestamp);
	var h = duration.hours();
	var m = duration.minutes();
	return h + "h " + m + "m";
};
