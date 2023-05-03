import AdmZip from 'adm-zip'
import { execSync  } from 'child_process';
import { existsSync, createReadStream, createWriteStream, readdirSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { exit } from 'process';
import axios from 'axios';
import { InstallOptions, XamppInfoData, _Modules } from './types';
import ProgressBar from 'progress';
import prompts from 'prompts'
import download from 'download';

/** THIS IS TO GET THE CURRENT VERSION OF THIS TOOL FROM PACKAGE.JSON */
export function getVersion() : string
{
    return require('../package.json').version
}

/**
 * This is to get the default install path for xampp on different machines
 * @returns string
 */
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

/**
 * To get details about an update about xampp from sourceforge.net
 * @returns Promise<XamppInfoData | null>
 */
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

/**
 * This functions download the update zip file from sourceforge.net
 * @param DownloadData This contains info about the new file to download , like link to file on sourceforge.net
 */
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

/**
 * This function checks if there is any downloaded xampp zip fiie
 */
function getCache() : XamppInfoData|null
{
    if(!existsSync(path.resolve('./download'))) return null
    const dir = readdirSync(path.resolve('./download'));
    if(dir.length <= 0) return null;
    let filename = dir.find(f => f.includes('xampp') && path.extname(f) == '.zip') ?? null
    const version = (filename?.match(/\d+\.\d+\.\d+/) ?? [''])[0]
    return filename ?{
        href : filename,
        file_name : filename,
        version: version
    } : null
}

/**
 * @params
 */
function downloadFile(url : string, file_name:string)
{
    file_name = file_name.replace('.7z', '.zip')
    file_name = path.basename(file_name)
    console.log(path.resolve('./download/'+file_name))
    if(!existsSync(`./download`)) mkdirSync(`./download`)
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
        readStream.on('close', () => {
            unlinkSync(`./download/${file_name}`)
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

function isAnUpdate(old_version: string, new_version: string) : boolean
{
    if(old_version == new_version) return false;
    const oldNumber = Number(old_version.split('.').join());
    const newNumber = Number(new_version.split('.').join());
    if(oldNumber >= newNumber) return false
    return true

}

export async function start(options: InstallOptions, xampp_dir : string, use_cache : boolean) : Promise<any>
{
    xampp_dir = path.resolve(xampp_dir)
    const php_v = getCurrenctPHPVersion()
    if(!existsSync(xampp_dir) || !php_v) throw new Error(`xampp - php not found in ${xampp_dir}`);
    let newVersion = getCache()
    if(use_cache && !newVersion) {
        console.log("No cache found")
        if((await askToDownload()).answer) newVersion =  await getNewZipDetail()
        return false;
    }
    if(!use_cache) newVersion = await getNewZipDetail() ?? newVersion
    if(!newVersion) throw new Error('An error occurred while installing ( cant find new version )');
    if(newVersion && !isAnUpdate(php_v, `${newVersion.version}`)){
        if(use_cache){
            console.log(`cache version is an older version`)
            if((await askToDownload()).answer) return start(options, xampp_dir, false)
        }
        throw new Error("xampp version uptodate")
    }
    if(!use_cache) await downloadUpdate(newVersion);
    extractAndMove(path.resolve(`./download/${newVersion.file_name}`), options, xampp_dir)
    return true;
}

async function askToDownload(){
    return await prompts({
            type:"confirm",
            name:"answer",
            message:"Do you wanna download it online"
    })
}