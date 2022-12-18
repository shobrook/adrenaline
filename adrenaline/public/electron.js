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

ipcMain.on("openFileRequest", (event, arg) => {
	// TODO: Prompt user to select a file in their file manager
	// TODO: Once a file is selected, read its contents

	event.reply("openFileResponse", {
		fileName: "test_program.py", // TEMP
		filePath: "test_program.py", // TEMP
		code: [
			"def main():",
			"\targs = sys.argv",
			"\tif len(args) == 1 or args[1].lower() in (\"-h\", \"--help\"):",
			"\t\tprinters.print_help_message()",
			"\t\treturn",
			"",
			"\tlanguage = parsers.get_language(args)",
			"\tif not language:",
			"\t\tprinters.print_invalid_language_message()",
			"\t\treturn"
		] // TEMP
	});
});


const config = rc(
   'gpt3-code-fix',
   defaultConfig,
   null,
   (content) => eval(content) // not good. but is it different from require()?
);

ipcMain.on("runCodeRequest", (event, arg) => {
	let stdOut = '';
	let stdErr = '';
	const { command } = arg;
	// command parsing
	// if (command === '') { // skip Spawn overhead
	// 	event.reply("runCodeResponse", {stdOut, stdErr});
	// 	return;
	// }

	commandParts = command.split(" ");
	const { spawn } = require('child_process');
	// TODO: handle when len == 1
	const child = spawn(commandParts[0], commandParts.slice(1))

	child.stdout.on('data', (data) => {
	  stdOut += data;
	});

	child.stderr.on('data', (data) => {
	  stdErr += data;
	});

	child.on('close', () => {
		console.log("close")
	  event.reply("runCodeResponse", {stdOut, stdErr});
		child.kill();
		console.log("close killed")
	});
	console.log('magic')
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
