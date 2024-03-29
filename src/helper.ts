import AdmZip from 'adm-zip'
import { execSync  } from 'child_process';
import { existsSync, createReadStream, createWriteStream, readdirSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { exit } from 'process';
import axios from 'axios';
import { InstallOptions, XamppInfoData, _Modules, versionNumber } from './types';
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

export function getOsplatform() : 'mac' | 'linux' | 'windows'
{
    if (process.platform === 'win32') {
        return 'windows'
    } else if (process.platform === 'linux') {
        return 'linux'
    } else if (process.platform === 'darwin') {
        return 'mac'
    }
    throw new Error(`Xupg is not avaliable for this platform ${process.platform}`);
}
/**
 * To get details about an update about xampp from sourceforge.net
 * @returns Promise<XamppInfoData | null>
 */
export async function getNewZipDetail() : Promise<XamppInfoData | null>
{
    let os = getOsplatform()
    try{
        const res = await axios.get("https://sourceforge.net/projects/xampp/best_release.json")
        if (res.data?.release){
            const version = res.data.platform_releases[os].filename.match(/\d+\.\d+\.\d+/)?.[0] as versionNumber
            // for the filename, we need to replace the 7z with zip and also replace any version number with the new version number
            const file_name = (res.data.release.filename  as String).replace('.7z', '.zip').replace(/\d+\.\d+\.\d+/g, version)
            const href = (res.data.release.url as String).replace('.7z', '.zip').replace(/\d+\.\d+\.\d+/g, version)
            return {
                file_name : file_name as string,
                version: version,
                href: href as string,
                // size:
            }
        }
    }catch(e){
        throw new Error((e as Error).message)
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
        version: version as versionNumber
    } : null
}

/**
 * This donwloads the new zip file from Sourceforge.net 
 * @param url - Sourceforge Link to file 
 * @param file_name Name to save the file as 
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
        // if process is killed by user, we want to remove the file being written
        process.on('SIGINT', () => {
            readStream.destroy()
            writeStream.end()
            unlinkSync(`./download/${file_name}`)
            process.exit()
        })
        readStream.on('error', (e) => {
            console.error('Error downloading file', e.message)
            console.error(e)
            writeStream.end()
            // delete the file
            unlinkSync(`./download/${file_name}`)
            exit(2)
        })
    })
    return readStream
}

/**
 * This prepares the new Zip file to be extrated and How it should be extracted
 * @param newZipSrc - path/filename of new Zip file to be extracted 
 * @param option This tell the program what module should be updated from the zip file 
 * @param install_dir The xampp installation directory
 */
export function extractAndMove(newZipSrc: string, option: InstallOptions, install_dir : string)
{   
    console.log(path.resolve(newZipSrc), install_dir)
    if(!existsSync(path.resolve(newZipSrc))) throw new Error(`Failed to find ${newZipSrc}`)
    const zip = new AdmZip(newZipSrc)
    if(option.all) return finalExtract(zip, "xampp/", `${install_dir}`);
    if(option.php) finalExtract(zip, "xampp/php/", `${install_dir}/php`);
    if(option.phpmyadmin) finalExtract(zip, "xampp/phpmyadmin/", `${install_dir}/phpmyadmin`);
    // if(option.mysql)
    return true;
}

// export function BackupAndUpgradeMysql(zip, entry = 'xampp/mysql/', install_dir)
{

}

/**
 * This does the whole extraction process
 * @param zip - THe zip file object
 * @param entry - Where should be extracted from the zip
 * @param to - Path to extract to
 */
function finalExtract(zip: AdmZip, entry:string, to:string) : true
{
    if(!entry.endsWith('/')) entry+="/"
    console.log('updating', entry)
    zip.getEntries().forEach(element => {
        const zip_folder_name = element.entryName.split('/').shift()
        const entry_n = element.entryName.replace(zip_folder_name+'/', '')
        // console.log(element.entryName, entry_n)
        if (element.entryName.startsWith(entry)) {
            console.log("================================")
            let des = to + element.entryName.replace(entry, '/')
            if (element.isDirectory == false) {
                des = path.dirname(des) + "/";
                zip.extractEntryTo(element.entryName, des, false, true)
            }
            console.log(element.isDirectory ? "Creating" : "Extracting ", element.entryName, element.isDirectory ? '' : `==>> ${des}`)
        }
    });
    return true;
}

/**
 * Get current PHP version from the cli
 */
function getCurrenctPHPVersion() : versionNumber|false
{
    try {
        const version = execSync('php -v').toString()
        const match = version.match(/^PHP\s+(\d+\.\d+\.\d+)/)
        // console.log(version, match)
        return match ? match[1] as versionNumber : false
    } catch (error) {
        return false;
    }
}


/**
 * Compares two version number
 * @param old_version - The purposed old version
 * @param new_version The purposed new version
 */
export function isAnUpdate(old_version: versionNumber, new_version: versionNumber) : boolean
{
    if(old_version == new_version) return false;
    //  Since the version number my be in type of 8.2.0 or 8.1.17 converting them to number directly and comparing them maybe ineffincent as 8117 is greater than 820 as a number but if we can add a trailing zero to version string and select the first four digit it would always give us a more effiecent number for comparism 
    // 8.2.0 would be 8200 and 8.1.17 would be 8117 which 8200 is much greater fitting rich for comparism 
    const oldNumber = `${old_version.split('.').join('')}0`.substring(0,4); 
    const newNumber = `${new_version.split('.').join('')}0`.substring(0,4);
    console.log(oldNumber , newNumber)
    if(Number(oldNumber) >= Number(newNumber)) return false
    return true

}

/**
 * The main starting process
 * @param options - flags / options passed in 
 * @param xampp_dir - xampp installation directory
 * @param use_cache - Determine if a cache download should be used 
 */
export async function start(options: InstallOptions, xampp_dir : string, use_cache : boolean) : Promise<boolean>
{
    console.log('Starting update process')
    xampp_dir = path.resolve(xampp_dir)
    const php_v = getCurrenctPHPVersion()
    if(!existsSync(xampp_dir) || !php_v) throw new Error(`xampp - php not found in ${xampp_dir}`);
    let newVersion = getCache()
    if(use_cache && !newVersion) {
        console.log("No cache found")
        if(!(await askToDownload()).answer) return false;
         newVersion =  await getNewZipDetail()
         use_cache = false
    }
    if(!use_cache) newVersion = await getNewZipDetail() ?? newVersion
    if(!newVersion) throw new Error('An error occurred while installing ( cant find new version )');
    console.log("====================================")
    console.log(`Current Xampp-php version : ${php_v}`)
    console.log(`Xampp-php version found : ${newVersion.version}`)
    console.log("====================================")
    if(!isAnUpdate(php_v, `${newVersion.version}`)){
        console.log("xampp up-to-date")
        if(use_cache){
            console.log(`cache version is an older version`)
            if((await askToDownload()).answer) return await start(options, xampp_dir, false)
        }
        if (!(await askToDownload(`Do you still wanna Install version { ${newVersion.version} }`)).answer) throw new Error("xampp version uptodate")
    }
    if(!(await askToDownload(`Are you sure you wanna install PHP version ${newVersion.version}`)).answer) return false;
    if(!use_cache) await downloadUpdate(newVersion);
    return extractAndMove("download/"+path.basename(`${newVersion.file_name}`), options, xampp_dir)
}

/**
 * Prompt a user asking if to download from sourceforge 
 */
async function askToDownload(message ?: string){
    return await prompts({
            type:"confirm",
            name:"answer",
            message:message ?? "Do you wanna download it online"
    })
}