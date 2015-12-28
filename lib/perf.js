getPerf = function() {
	return performance.now();
}

logPerf = function(start, msg) {
	console.log(performance.now() - start +  ": " + msg)
}