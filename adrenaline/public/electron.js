/***********
 * Constants
 ***********/

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");

/**************
 * Window Setup
 **************/

let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 1000,
		resizable: false,
		// titleBarStyle: "hidden",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	mainWindow.loadURL(
		isDev
			? "http://localhost:3000"
			: `file://${path.join(__dirname, "../build/index.html")}`
	);
	mainWindow.on("closed", () => (mainWindow = null));
	mainWindow.webContents.openDevTools(); // TEMP: For testing
}

app.whenReady().then(createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

/******************************
 * Inter-Process Event Handlers
 ******************************/

ipcMain.on("openFileRequest", (event, arg) => {
	// TODO: Prompt user to open file
	event.reply("openFileResponse", {
		fileName: "test.py",
		filePath: "test.py",
		code: ["my_var = [i ** 2 for i in range(10)]"]
	});
});
ipcMain.on("fixErrorRequest", (event, arg) => {
  const { brokenCode, stackTrace } = arg; // brokenCode as [lineOfCode1, lineOfCode2, ...]
  event.fixedCode = {};
});
