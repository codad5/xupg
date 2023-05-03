import AdmZip from 'adm-zip'
import { doesNotMatch } from 'assert';
import { ChildProcess,execSync,spawn, spawnSync } from 'child_process';
import { OptionValues } from 'commander';
import { existsSync, createReadStream, createWriteStream, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { version } from 'os';
import path from 'path';
import { exit } from 'process';
import axios from 'axios';
import { InstallOptions, XamppInfoData, _Modules } from './types';
import ProgressBar from 'progress';
import prompts from 'prompts'
import download from 'download';

const APP_DIR = path.dirname(process.argv[1])
export function getVersion() : string
{
    return require('../package.json').version
}

export function getDefaultXamppDir()
{
    if (process.platform === 'win32') {
    return process.env.ProgramFiles?.split(':')[0]+ ':\\xampp';
    } else if (process.platform === 'linux') {
    return  '/opt/lampp';
    } else if (process.platform === 'darwin') {
    return '/Applications/XAMPP';
    }
    throw new Error(`Xupg is not avaliable for this platform ${process.platform}`);
}

export async function getNewZipDetail() : Promise<XamppInfoData | null>
{
    const res = await axios.get("https://sourceforge.net/projects/xampp/best_release.json")
    if (res.data?.release){
        return {
            href : res.data.release.url as string,
            version: res.data.release.date,
            file_name: res.data.release.filename as string,
            // size:
        }
    }
    return null
    
}

export async function downloadUpdate(DownloadData : XamppInfoData) : Promise<String>
{
    let {href, file_name} = DownloadData
    if(href.includes('.7z')) href = href.replace('.7z', '.zip')
    console.log("downloading ", href)
    // const d =  await download(update.href, './download')
    const d = await downloadFile(href as string, file_name)
    // console.log('done downloading')
    return file_name;
}

function getCache() : XamppInfoData|null
{
    if(!existsSync(path.resolve('./download'))) return null
    const dir = readdirSync(path.resolve('./download'));
    if(dir.length <= 0) return null;
    let filename = dir.find(f => f.includes('xampp') && path.extname(f) == '.7z') ?? null
    const version = (filename?.match(/\d+\.\d+\.\d+/) ?? [''])[0]
    return filename ?{
        href : filename,
        file_name : filename,
        version: version
    } : null
}

function downloadFile(url : string, file_name:string)
{
    file_name = file_name.replace('.7z', '.zip')
    file_name = path.basename(file_name)
    console.log(path.resolve(APP_DIR+'/download/'+file_name))
    if(!existsSync(`${APP_DIR}/download`)) mkdirSync(`${APP_DIR}/download`)
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
        readStream.on('close', () => {
            unlinkSync(APP_DIR+`/download/${file_name}`)
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

export function extractAndMove(newZipSrc: string, option: InstallOptions, install_dir : string)
{   
    console.log(path.resolve(newZipSrc), install_dir)
    const zip = new AdmZip(newZipSrc)
    if(option.all) return finalExtract(zip, "xampp/", `${install_dir}`);
    if(option.php) finalExtract(zip, "xampp/php/", `${install_dir}/php`);
    if(option.phpmyadmin) finalExtract(zip, "xampp/phpmyadmin/", `${install_dir}/phpmyadmin`);
}

function finalExtract(zip: AdmZip, entry:string, to:string)
{
    if(!entry.endsWith('/')) entry+="/"
    console.log('updating', entry)
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

export async function start(options: InstallOptions, xampp_dir : string, use_cache : boolean){
    xampp_dir = path.resolve(xampp_dir)
    const php_v = getCurrenctPHPVersion()
    if(!existsSync(xampp_dir) || !php_v) throw new Error(`xampp - php not found in ${path}`);
    let newVersion = getCache()
    if(use_cache && !newVersion) {
        console.log("No cache found")
        const ask = await prompts({
            type:"confirm",
            name:"answer",
            message:"Do you wanna download it online"
        })
        if(ask.answer) newVersion =  await getNewZipDetail()
        return false;
    }
    if(!use_cache) newVersion = await getNewZipDetail() ?? newVersion
    if(!newVersion) throw new Error('An error occurred while installing ( cant find new version )');
    if(newVersion && `${newVersion.version}` == php_v) throw new Error("xampp version uptodate")
    if(!use_cache) await downloadUpdate(newVersion);
    extractAndMove(path.resolve(`./download/${newVersion.file_name}`), options, xampp_dir)
    return true;
}