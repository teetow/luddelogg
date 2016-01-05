let SheetLoaderHandle = Meteor.npmRequire('edit-google-spreadsheet');

SheetSyncer = class SheetSyncer {
	constructor(credentials) {
		this.identity = Math.floor(Math.random() * 9);
		this.credentials = credentials;
		this.isSyncing = false;
	}

	requestData(callback, loop = false) {
		this.callback = callback;
		if (loop) {
			this._getSheetHandleLoop();
			this._getSheetDataLoop();
		} else {
			try {
				let loginHandle = this._getSheetHandle(this.credentials);
				let dataHandle = this._getSheetData(loginHandle);
				this._callback(dataHandle);

			} catch (e) {
				throw (`Error during sync: ${JSON.stringify(e)}`);
			}
		}
	}

	_callback(dataHandle) {
		if (this.callback && dataHandle)
			this.callback(dataHandle);
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
			throw "Aborted fetch -- already syncing.";
		}
		this.isSyncing = true;
		let receiveSync = Meteor.wrapAsync(loginHandle.receive, loginHandle);
		let data = receiveSync({
			getValues: true
		});

		this.isSyncing = false;
		return data;
	}

	_getSheetHandleLoop() {
		let self = this;
		try {
			self.loginHandle = self._getSheetHandle(self.credentials);
			Meteor.setTimeout(() => {
				self._getSheetHandleLoop();
			}, 3000000);
		} catch (e) {
			console.log(`Error getting sheet handle: ${JSON.stringify(e)}`);
			// if an error occurred, try again in just 30s
			Meteor.setTimeout(() => {
				self._getSheetHandleLoop();
			}, 30000);

		}
	}

	_getSheetDataLoop(callback) {
		let self = this;
		let data;
		try {
			data = self._getSheetData(self.loginHandle);
		} catch (e) {
			console.log(`Error getting sheet handle: ${JSON.stringify(e)}`);
		}

		Meteor.setTimeout(() => {
			self._getSheetDataLoop();
		}, 30000);
		self._callback(data);
	}
}
