#! /usr/bin/env node

import { Command } from "commander"
import { getDefaultXamppDir, getVersion, start } from "./helper";
import figlet from 'figlet'
import { exit } from "process";
import { InstallOptions } from "./types";
const program = (new Command)
.name("xupg (upgrade your xampp php version")
.version(getVersion())
.description('upgrade your xampp version')
.option("-p, --php", "Upgrade current php version")
.option('-ph, --phpmyadmin', "upgrade phpmyadmin")
.option('-c, --cache', "Use cache")
.option('-ms, --mysql', "Upgrade mysql version")
.option('-f, --full', "Upgrade full php version")
.option('-d, --dir <value>', "Select your xampp installation directory")
.parse(process.argv)

console.log('welcome to xupg')

async function main(program : Command){
    const options = program.opts();
    const default_xampp_dir = getDefaultXamppDir()
    const toInstall : InstallOptions = {
        php : options.php,
        phpmyadmin: options.phpmyadmin,
        mysql : options.mysql,
        all: options.full || (options.phpmyadmin && options.php && options.mysql)
    }
    // at least one option should be selected
    if(!toInstall.php && !toInstall.phpmyadmin && !toInstall.mysql && !toInstall.all) return program.help()
    return await start(toInstall, options.dir ?? default_xampp_dir, options.cache)
}


console.time('main')
main(program)
.then((d) => {
    d ? console.log('Ended successfully in') : console.warn('Ended unsucessfully in')
})
.catch((e) => {
    console.error(e)
    console.log("=====================================================")
    console.log("=====================================================")
    console.log('An error occured : ', e.message)
    console.warn('Ended unsucessfully in')
})
.finally(() => {
    console.log(figlet.textSync("XUPG"))
    console.timeEnd('main')
    console.log(figlet.textSync("Restart XAMPP"))
    exit(0)
})