import { app, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';

const application = app;
let main: BrowserWindow | null;

function createWindow() {
	const icon = nativeImage.createFromPath(
		path.join(__dirname, 'src/assets/logo.png')
	);

	main = new BrowserWindow({
		width: 1350,
		height: 757,
		icon
	});

	// createMenu();

	// main.loadURL(`file://${__dirname}/index.html`);
	main.loadURL(`http://localhost:8081`);

	main.on('closed', () => {
		main = null;
	});
}

application.on('ready', createWindow);

application.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

application.on('activate', () => {
	if (main === null) {
		createWindow();
	}
});
