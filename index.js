const path = require('path');
const fs = require('fs');
const url = require('url');
const {app, BrowserWindow, ipcMain} = require('electron');
const ejse = require('ejs-electron')
const express = require('express');
const color = require('colors');
const axios = require('axios');


const urlAll = 'http://localhost:3001'
const token = JSON.parse(fs.readFileSync('./keys.json')).key_token

const axiosConfigPOST = (elem, url) => {
    return {
        method: 'POST',
        url: urlAll + url, 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        data: JSON.stringify(elem)
    }
};

const settingsAxios = (data) => {
    return new Promise(async res => {
        console.log()
        const dir               =  './media/'
        const videoLink         =   path.basename(data.video.replace(/^.*\\/, ""), path.extname(data.video.replace(/^.*\\/, "")));
        const shortVideoLink    =   data.newVideo;
        const parts             =   data.parts;
        const shortTime         =   data.shortTime; 

        const video = fs.createReadStream(dir + videoLink + '.mp4');
        let chunks = [];
        video.on('data', chunk => chunks.push(chunk));
        video.on('end', async () => {
            const info = {
                video: Buffer.concat(chunks),
                parts: parts,
                shortTime: shortTime,
            } 
            const dataReq = await axios(axiosConfigPOST(info, '/short-video-download'));
            const writeStream = fs.createWriteStream(dir + shortVideoLink + '.mp4');
            writeStream.write(Buffer.from(dataReq.data, 'utf-8'));
            res({video: dir + shortVideoLink + '.mp4'})
        })
    })
}

let win;
ejse.data('username', 'Some Guy')

function createWindow(){
    win = new BrowserWindow({
        width: 400,
        height: 700,
        icon: path.join(__dirname, 'views', 'img', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    ipcMain.on('item:add', async (e, data )=>{
        const link = await settingsAxios(data); 
        win.webContents.send('item:new', link.video)
    })

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    })
}

app.on('ready', createWindow);


