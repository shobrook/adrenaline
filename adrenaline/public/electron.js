/***********
 * Constants
 ***********/

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");
const { Configuration, OpenAIApi } = require("openai");
const rc = require('rc');
const defaultConfig = require('./config.js');

/*********
 * Helpers
 *********/

const buildGPTPrompt = (brokenCode, stackTrace) => {
	// const config = rc(
	//    'gpt3-code-fix',
	//    defaultConfig,
	//    null,
	//    (content) => eval(content) // not good. but is it different from require()?
	// );
	return `${defaultConfig.prompt}
					${defaultConfig.codeKey}
					${brokenCode}

					${defaultConfig.errorKey}
					${stackTrace}

					${defaultConfig.solutionKey}`;
}

/**************
 * Window Setup
 **************/

let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 600,
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

ipcMain.on("runCommandRequest", (event, arg) => {
	console.log("Received runCommandRequest");

	let stdout = '';
	let stderr = '';
	const { command } = arg;

	const { exec, spawn } = require('node:child_process');
	exec(command, (err, stdout, stderr) => {
	  if (err) {
	    // something handly
			console.log("exec Error: ", err)
	  }
	  event.reply("runCommandResponse", {stdout, stderr});
	});
});

ipcMain.on("fixErrorRequest", (event, arg) => {
  const { code, stackTrace } = arg;
	const prompt = buildGPTPrompt(code, stackTrace);
	const apiConfig = new Configuration({apiKey: defaultConfig.apiKey});
	const api = new OpenAIApi(apiConfig);

	api
		.createCompletion({
	    prompt,
	    ...defaultConfig.completionPromptParams
	  })
	  .then(data => {
			event.reply("fixErrorResponse", {fixedCode: data.data.choices[0].text.split("\n")});
		})
		.catch((error) => console.log(error.response));
});
