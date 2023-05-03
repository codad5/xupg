#! /usr/bin/env node

import { Command } from "commander"
import { getDefaultXamppDir, getVersion, start } from "./helper";
import fs from 'fs'
import { exit } from "process";
import { InstallOptions } from "./types";

const program = new Command;
// const DEFAULT_DIR = getDefaultXamppDir();
// const DEFAULT_DIR =  './test_zip/2/php/';
console.log('welcome to xupg')

async function main(program : Command){
    program
    .name("xupg (upgrade your xampp php version")
    .version(getVersion())
    .description('upgrade your xampp version')
    .option("-p, --php", "Upgrade current php version")
    .option('-ph, --phpmyadmin', "upgrade phpmyadmin")
    .option('-c, --cache', "Use cache")
    .option('-f, --full', "Upgrade full php version")
    .option('-d, --dir <value>', "Select your xampp installation directory")
    .parse(process.argv)

    const options = program.opts();
    console.log(process.argv);
    const default_xampp_dir = getDefaultXamppDir()
    const toInstall : InstallOptions = {
        php : options.php,
        phpmyadmin: options.phpmyadmin,
        all: options.full || (options.phpmyadmin && options.php)
    }

    return await start(toInstall, options.dir ?? default_xampp_dir, options.cache)
}

// the main process
console.time('main')
main(program)
.then((d) => {
    d ? console.log('Ended successfully in') : console.warn('Ended unsucessfully in')
})
.catch((e) => {
    console.log('An error occured : ', e.message)
    console.warn('Ended unsucessfully in')
})
.finally(() => {
    console.timeEnd('main')
})