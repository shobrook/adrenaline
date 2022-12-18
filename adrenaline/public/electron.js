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

const config = rc(
   'gpt3-code-fix',
   defaultConfig,
   null,
   (content) => eval(content) // not good. but is it different from require()?
);

ipcMain.on("runCodeRequest", (event, arg) => {

	const { command } = arg;

	const { spawn } = require('child_process');
	// TODO: determine command type (python, bash, etc) via file extension
	const child = spawn('python3', [command])
	let stdOut = '';
	let stdErr = '';

	child.stdout.on('data', (data) => {
	  stdOut += data;
	});

	child.stderr.on('data', (data) => {
	  stdErr += data;
	});

	child.on('close', () => {
	  event.reply("runCodeResponse", {stdOut, stdErr});
	});
});

ipcMain.on("fixErrorRequest", (event, arg) => {
  const { brokenCode, stackTrace } = arg; // brokenCode as {lineNo: lineOfCode}
	if (!stackTrace) {
	   console.error("No RunTime errors.");
	   process.exit(1);
	}
	const prompt = `${config.prompt}
	${config.kCode}
	${brokenCode}

	${config.kError}
	${stackTrace}

	${config.kSolution}
	`
	const apiConfig = new Configuration({
  	apiKey: config.openAiKey
	});
	const openai = new OpenAIApi(apiConfig);

	openai
	  .createCompletion({
	    prompt,
	    ...config.completionPromptParams
	  })
	  .then((data) => {
			//for choice in data.data.choices:
				//console.log('choice: \n', choice.text);
			event.reply("fixErrorResponse", {fixedCode: data.data.choices[0].text});
		})
		.catch((error) => console.log(error.response));

});
