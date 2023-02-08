import AdmZip from 'adm-zip'
import { doesNotMatch } from 'assert';
import { ChildProcess,execSync,spawn, spawnSync } from 'child_process';
import { OptionValues } from 'commander';
import { existsSync, createReadStream, createWriteStream, readdirSync } from 'fs';
import { version } from 'os';
import path from 'path';
import { exit } from 'process';
import axios from 'axios';
import { _Modules } from './types';
import ProgressBar from 'progress';
import prompts from 'prompts'
import download from 'download';

const APP_DIR = path.resolve(process.argv[1])
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
                file_name: res.data.release.filename as string,
                // size:
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

function getCache()
{
    const dir = readdirSync(APP_DIR+'/download');
    if(dir.length <= 0) return false;
    return dir.find(f => f.includes('xampp') && path.extname(f) == '.zip')
    // return `download/${xampp}`
}
function downloadFile(url : string, file_name:string)
{
    file_name = file_name.replace('.7z', '.zip')
    file_name = path.basename(file_name)
    console.log(path.resolve(APP_DIR+'/download/'+file_name))
    const writeStream = createWriteStream(APP_DIR+`/download/${file_name}`)
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
            finalExtract(zip, "xampp/php/", `${option.install_dir}/php`);
        break;
    }
}

function finalExtract(zip: AdmZip, entry:string, to:string)
{
    if(!entry.endsWith('/')) entry+="/"
    console.log('here', entry)
    zip.getEntries().forEach(element => {
        const zip_folder_name = element.entryName.split('/').shift()
        const entry_n = element.entryName.replace(zip_folder_name+'/', '')
        // console.log(element.entryName, entry_n)
        if (entry_n.startsWith(entry)) {
            console.log("================================")
            let des = to + entry_n.replace(entry, '')
            if (element.isDirectory == false) {
                des = path.dirname(des) + "/";
                zip.extractEntryTo(element.entryName, des, false, true)
            }
            console.log(element.isDirectory ? "Creating" : "Extracting ", element.entryName, element.isDirectory ? '' : `==>> ${des}`)
        }
    });
    return true;
}

export async function updatePHP(path = `${getHomeDir()}/xampp/`, use_cache = false)
{
    try{
        const p = require('path')
        console.log(p.resolve(path))
        const php_v = getCurrenctPHPVersion()
        if(!existsSync(path) || !php_v) throw new Error(`xampp - php not found in ${path}`);
        console.log("===========================")
        console.log("Currenct php version => "+php_v)
        console.log("===========================")
        let d = use_cache ? getCache() : await downloadUpdate() 
        console.log(d)
        if(!d && use_cache) {
            console.log('no cache found', d)
            const ask = await prompts({
                type:"confirm",
                name:"answer",
                message:"Do you wanna download it online"
            })
            if(ask.answer) {d = await downloadUpdate();}
            else{console.log('exiting...', exit())}
        }
        const done = extractAndMove(`./download/${d}`, { module: 'php', install_dir: path });
        const n_php_v = getCurrenctPHPVersion()
        if (!existsSync(path) || !n_php_v) throw new Error(`xampp - php not found in ${path}`);
        console.log("===========================")
        console.log("updated php version => " + n_php_v)
        console.log("===========================")
        return true;
        // .catch(e)
        // return true;
    }catch(e)
    {
        console.log(e)
        exit(2)
    }

}

function getCurrenctPHPVersion()
{
    try {
        const version = execSync('php -v').toString()
        const match = version.match(/^PHP\s+(\d+\.\d+\.\d+)/)
        // console.log(version, match)
        return match ? match[1] : false
    } catch (error) {
        return false;
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