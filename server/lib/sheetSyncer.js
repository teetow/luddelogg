let SheetLoaderHandle = Meteor.npmRequire('edit-google-spreadsheet');

SheetSyncer = class SheetSyncer {
	constructor(credentials) {
		this.credentials = credentials;
		this.isSyncing = false;
	}

	requestData(callback, loop = false) {
		this.callback = callback;
		if (loop) {
			this._getSheetHandleLoop();
			this._getSheetDataLoop();
		} else {
			this.loginHandle = this._getSheetHandle();
			this.dataHandle = this._getSheetData();
			this._callback();
		}
	}

	_callback() {
		if (this.callback)
			this.callback(this.dataHandle);
	}

	_getSheetHandle() {
		AddMessage("Loading...", "_getSheetHandle");
		let loadSpreadsheetSync = Meteor.wrapAsync(SheetLoaderHandle.load, SheetLoaderHandle);
		return loadSpreadsheetSync(this.credentials);
	}

	_getSheetData() {
		if (!this.loginHandle) {
			throw "Cannot fetch Google sheet -- Sheet not loaded.";
		}
		if (this.isSyncing) {
			throw "Aborted fetch -- already syncing.";
		}
		AddMessage("Requesting sheet data...", "_getSheetData");
		this.isSyncing = true;
		let receiveSync = Meteor.wrapAsync(this.loginHandle.receive, this.loginHandle);
		let data = receiveSync({
			getValues: true
		});
		this.isSyncing = false;
		return data;
	}

	_getSheetHandleLoop() {
		let self = this;
		self.loginHandle = self._getSheetHandle();
		Meteor.setTimeout(() => {
			self._getSheetHandleLoop();
		}, 3000000);
	}

	_getSheetDataLoop(callback) {
		let self = this;
		self.dataHandle = self._getSheetData();
		Meteor.setTimeout(() => {
			self._getSheetDataLoop();
		}, 30000);
		self._callback();
	}
}
