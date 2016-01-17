let SheetLoaderHandle = Meteor.npmRequire('edit-google-spreadsheet');

SheetSyncer = class SheetSyncer {
	constructor() {
		this.identity = Math.floor(Math.random() * 9);
		this.isSyncing = false;
	}

	requestData(options = {loop: false}) {
		if (options.credentials) {
			this.credentials = this._getSheetHandle(options.credentials);
		}

		if (options.loop) {
			this._getSheetHandleLoop(options.credentials);
			this._getSheetDataLoop(options.callback);
		} else {
			try {
				let loginHandle = this._getSheetHandle(options.credentials);
				let dataHandle = this._getSheetData(loginHandle);
				if (options.callback && dataHandle)
					options.callback(dataHandle);

			} catch (e) {
				throw (`Error during request: ${JSON.stringify(e)}`);
			}
		}
	}

	_getSheetHandle(credentials) {
		let loadSpreadsheetSync = Meteor.wrapAsync(SheetLoaderHandle.load, SheetLoaderHandle);
		return loadSpreadsheetSync(credentials);
	}

	_getSheetData(loginHandle) {
		if (!loginHandle) {
			throw "Cannot fetch Google sheet -- Sheet not loaded.";
		}
		if (this.isSyncing) {
			AddMessage("Aborted fetch -- already syncing.", "_getSheetData");
			return;
		}
		this.isSyncing = true;
		let receiveSync = Meteor.wrapAsync(loginHandle.receive, loginHandle);
		try {
			let data = receiveSync({
				getValues: true
			});
			return data;
		} catch (e) {
			throw e;
		} finally {
			this.isSyncing = false;
		}
	}

	_getSheetHandleLoop(credentials) {
		let self = this;
		let timer = 1000 * 60 * 50; // 50 mins
		try {
			self.loginHandle = self._getSheetHandle(credentials);
		} catch (e) {
			console.log(`Error getting sheet handle: ${JSON.stringify(e)}`);
			timer = 1000 * 30; // 30 secs
		} finally {
			Meteor.setTimeout(() => {
				self._getSheetHandleLoop(credentials);
			}, timer);
		}
	}

	_getSheetDataLoop(callback) {
		if (!callback)
			throw "missing callback";
		let self = this;
		let data;
		try {
			data = self._getSheetData(self.loginHandle);
		} catch (e) {
			console.log(`Error getting sheet handle: ${JSON.stringify(e)}`);
		}

		Meteor.setTimeout(() => {
			self._getSheetDataLoop(callback);
		}, 30000);

		if (data)
			callback(data);
		else
			throw ("fetch returned no data.");
	}
}
