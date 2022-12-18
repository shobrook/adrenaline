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
const Diff = require("diff");

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

const parseGPTOutput = (brokenCode, fixedCode) => {
	console.log("broken code: \n", brokenCode)

	const diff = Diff.diffTrimmedLines(brokenCode, fixedCode);
	let mergedCode = "";

	for (let i = 0; i < diff.length; i++) {
		let part = diff[i];

		console.log("diff value: ", part.value)
		console.log("diff added: ", part.added)
		console.log("diff removed: ", part.removed)

		if (!part.added && !part.removed) {
			mergedCode += part.value;
		} else if (part.removed) {
			mergedCode += '>>>OLD CODE<<<\n';

			for (let j = 0; j < part.value.length; j++) {
				mergedCode += part.value[j];
			}

			mergedCode += "================\n"
		} else if (part.added) {
			for (let j = 0; j < part.value.length; j++) {
				mergedCode += part.value[j];
			}

			mergedCode += '>>>FIXED CODE<<<\n'
		}
	}

	console.log("final merged code: ", mergedCode)

	const codeChanges = [];
	const lines = mergedCode.split('\n');

	let oldLines = [];
	let newLines = [];
	let mergeLine = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.includes('>>>OLD CODE<<<')) {
			oldLines.push(i);
		} else if (line.includes('>>>FIXED CODE<<<')) {
			newLines.push(i);
		} else if (line.includes('===============')) {
			mergeLine = i;
		}

		if (oldLines.length > 0 && newLines.length > 0 && mergeLine > -1) {
			for (let j = oldLines[0]+1; j < mergeLine; j++) {
				oldLines.push(j);
			}

			for (let k = mergeLine+1; k < newLines[0]; k++) {
				newLines.push(k);
			}

			codeChanges.push({ oldLines, newLines, mergeLine });
			oldLines = [];
			newLines = [];
			mergeLine = -1;
		}
	}

	codeChanges.forEach( (codeChange) => {
		console.log("\tlines added: ", codeChange.newLines)
		console.log("\tlines removed: ", codeChange.oldLines)
		console.log("\tmed line: ", codeChange.mergeLine)
	});

	return {
		mergedCode,
		codeChanges
	};
}

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
	let testBrokenCodeStr = `
		x = 10
		y = "hey"
		z = "yo"
		result = x + y + z
		print("What's up")
	`
	let testFixedCodeStr = `
		x = 10
		y = 20
		z = 30
		result = x + y + z
		print(result)
	`
	const { mergedCode, codeChanges } = parseGPTOutput(testBrokenCodeStr, testFixedCodeStr);
	event.reply("fixErrorResponse", { mergedCode, codeChanges });
	return;

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
