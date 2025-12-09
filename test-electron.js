// test-electron.js
import { app, BrowserWindow } from 'electron';

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    backgroundColor: '#ff0000' // Bright red so you can see it
  });
  
  win.loadURL('data:text/html,<h1 style="color:white;background:blue;padding:20px;">ELECTRON WORKS!</h1>');
  win.show();
  win.focus();
  
  console.log('✅ Test window created');
});

app.on('window-all-closed', () => {
  app.quit();
});