Router.map(function(){
	this.route('dashboard', {
		waitOn: function() {
			Session.set('googleLoaded', false);
			return IRLibLoader.load('https://www.google.com/jsapi', {
				success: function(){
					console.log('API loaded.');
					loadChartLibs();
				}
			});
		}
	});
});

function loadChartLibs() {
	google.load('visualization', '1', {
		packages:["timeline"],
		callback: function()
		{
			console.log('lib loaded.');
			Session.set('googleLoaded', true);
		}
	});	
}