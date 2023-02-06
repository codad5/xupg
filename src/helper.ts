import AdmZip from 'adm-zip'
import { doesNotMatch } from 'assert';
import { ChildProcess,spawn, spawnSync } from 'child_process';
import { OptionValues } from 'commander';
import { existsSync, createReadStream, createWriteStream } from 'fs';
import { version } from 'os';
import path from 'path';
import { exit } from 'process';
import axios from 'axios';
import { _Modules } from './types';
import ProgressBar from 'progress';
import download from 'download';

// const modules = ['full', 'php', 'phpmyadmin']
export function getVersion() : string
{
    return require('../package.json').version
}

export function getHomeDir() : string 
{
    return require('os').homedir()
}

export async function getNewZipDetail()
{
    //  code to get new zip details
    try{
        const res = await axios.get("https://sourceforge.net/projects/xampp/best_release.json")
        if (res.data?.release){
            return {
                href : res.data.release.url as string,
                version: res.data.release.date,
                file_name: res.data.release.filename as string
            }
        }
        return false
    }
    catch(e)
    {
        console.log('Error', e)
        exit(2)
    }
    
}

export function isAnUpdate(version:number)
{
    // code to compare update on machine and the zip found in getNewZip
    return true;
}

export async function downloadUpdate() : Promise<String>
{
    //get update detail
    const update = await getNewZipDetail()
    //check if it is an update 
    console.log(update)
    if(!update) throw new Error('Something went wrong')
    if(!isAnUpdate(update.version)) throw new Error("Version up to Date")
    // code to download from sourceforge
    // download(update.src, '../')
    let {href, file_name} = update
    if(href.includes('.7z')) href = href.replace('.7z', '.zip')
    console.log("downloading ", href)
    // const d =  await download(update.href, './download')
    const d = await downloadFile(update.href as string, update.file_name)
    // console.log('done downloading')
    return file_name;
}
function downloadFile(url : string, file_name:string)
{
    file_name = file_name.replace('.7z', '.zip')
    file_name = path.basename(file_name)
    console.log(path.resolve('./download/'+file_name))
    const writeStream = createWriteStream(`./download/${file_name}`)
    const readStream = download(url)
    readStream.on('response', function (res) {
        const len = parseInt(res.headers['content-length'] ?? '', 10)
        const bar = new ProgressBar('  downloading [:bar] :rate/bps :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: len
        })
        readStream.on('data', function (chunk) {
            writeStream.write(chunk)
            bar.tick(chunk.length)
        })
        readStream.on('end', function () {
            console.log('Download done with success\n')
            writeStream.end()
        })
        readStream.on('error', (e) => {
            console.error('Error downloading file', e.message)
            console.error(e)
            writeStream.end()
            exit(2)
        })
    })
    return readStream
}

export function extractAndMove(newZipSrc: string, option: { module : _Modules, install_dir: string } = { install_dir: `${getHomeDir()}/xampp/`, module : 'php'})
{   
    console.log(path.resolve(newZipSrc))
    const zip = new AdmZip(newZipSrc)
    switch (option.module){
        case 'php':
            finalExtract(zip, "test_zip/2/php/", `${option.install_dir}/php`);
        break;
    }
}

function finalExtract(zip: AdmZip, entry:string, to:string)
{
    if(!entry.endsWith('/')) entry+="/"
    console.log('here', entry)
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

export async function updatePHP(path = `${getHomeDir()}/xampp/`)
{
    try{
        const p = require('path')
        console.log(p.resolve(path))
        if(!existsSync(path)) throw new Error(`xampp - php not found in ${path}`);
        const d = await downloadUpdate();
        const done = extractAndMove(d as string, { module: 'php', install_dir: path });
        return true;
        // .catch(e)
        // return true;
    }catch(e)
    {
        console.log(e)
        exit(2)
    }

}

// export function update(mod: _Modules, options: OptionValues)
// {
//     switch(mod)
//     {
//         case 'php' :
//             updatePHP(options.dir ??)
//     }
// }