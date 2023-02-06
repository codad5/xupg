import AdmZip from 'adm-zip'
import { doesNotMatch } from 'assert';
import { ChildProcess,spawn, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { version } from 'os';
import path from 'path';
import { exit } from 'process';
import { _Modules } from './types';

// const modules = ['full', 'php', 'phpmyadmin']
export function getVersion() : string
{
    return require('../package.json').version
}

export function getHomeDir() : string 
{
    return require('os').homedir()
}

export function getNewZipDetail()
{
    //  code to get new zip details
    return {
        href:'../test.zip',
        version:1.0
    }
}

export function isAnUpdate(version:number)
{
    // code to compare update on machine and the zip found in getNewZip
    return true;
}

export function downloadUpdate() : String
{
    //get update detail
    const update = getNewZipDetail()
    //check if it is an update 
    if(!isAnUpdate(update.version)) throw new Error("Version up to Date")
    // code to download from sourceforge
    // download(update.src, '../')
    return "./test.zip";
}

export function extractAndMove(newZipSrc: string, option: { module : _Modules, install_dir: string } = { install_dir: `${getHomeDir()}/xampp/`, module : 'php'})
{   
    const zip = new AdmZip(newZipSrc)
    switch (option.module){
        case 'php':
            finalExtract(zip, "test/2/php/", `${option.install_dir}/php`);
        break;
    }
}

function finalExtract(zip: AdmZip, entry:string, to:string)
{
    if(!entry.endsWith('/')) entry+="/"
    zip.getEntries().forEach(element => {
        // console.log(element.toString())
        if (element.entryName.startsWith(entry)) {
            console.log("================================")
            let des = entry + element.entryName.replace(entry, '')
            if (element.isDirectory == false) {
                des = path.dirname(des) + "/";
                zip.extractEntryTo(element.entryName, des, false, true)
            }
            console.log(element.isDirectory ? "Creating" : "Extracting ", element.entryName, element.isDirectory ? '' : `==>> ${des}`)
        }
    });
    return true;
}

export function updatePHP(path = `${getHomeDir()}/xampp/`)
{
    try{
        const p = require('path')
        console.log(p.resolve(path))
        if(!existsSync(path)) throw new Error(`xampp - php not found in ${path}`);
        const download = downloadUpdate()
        const done = extractAndMove(download as string, {module:'php', install_dir:'../test/2/php'})
        return done;
    }catch(e)
    {
        console.log(e)
        exit(500)
    }

}