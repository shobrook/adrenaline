/***********
 * Constants
 ***********/

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");
const fs = require("fs");
const os = require("os");
const { Configuration, OpenAIApi } = require("openai");
const { exec, spawn } = require('node:child_process');
const defaultConfig = require('./config.js');
//const diff = require('diff');
/*********
 * Helpers
 *********/

const buildGPTPrompt = (brokenCode, stackTrace) =>
	`${defaultConfig.prompt}
	 ${defaultConfig.codeKey}
	 ${brokenCode}

	 ${defaultConfig.errorKey}
	 ${stackTrace}

	 ${defaultConfig.solutionKey}`;

/**************
 * Window Setup
 **************/

let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 700,
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
	const { command, currDir } = arg;

	if (command.trim() === "") {
		event.reply("runCommandResponse", { command, stdout: "", stderr: "" });
		return;
	}

	let commandToRun;
	let commandParts = command.split(" ");
	if (commandParts.length > 1) {
		const homeDir = os.homedir();
		const relativePath = `${currDir}/${commandParts[1]}`
		const absolutePath = path.resolve(homeDir, relativePath);

		commandToRun = `${commandParts[0]} ${absolutePath} ${commandParts.slice(2, commandParts.length)}`;
	} else {
		commandToRun = command;
	}

	exec(commandToRun, (err, stdout, stderr) => {
	  event.reply("runCommandResponse", {command, stdout, stderr});
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
			//diffTool(code, data.data.choices[0].text.split("\n"))
			event.reply("fixErrorResponse", {fixedCode: data.data.choices[0].text.split("\n")});
		})
		.catch((error) => console.log(error.response));
});

ipcMain.on("saveFileRequest", (event, arg) => {
	const { code, filePath } = arg;
	const homeDir = os.homedir();
	const fullPath = path.resolve(homeDir, filePath);

	fs.writeFile(fullPath, code.join("\n"), { flag: 'wx' }, err => {
		if (err) {
			console.log(filePath);
			console.log(err);
			event.reply("saveFileResponse", { success: false });
		} else {
			event.reply("saveFileResponse", { success: true })
		}
	});

})
