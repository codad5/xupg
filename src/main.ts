#! /usr/bin/env node

import { Command } from "commander"
import { getHomeDir, getVersion, updatePHP } from "./helper";
import fs from 'fs'
import { exit } from "process";

const program = new Command;
const DEFAULT_DIR = `${getHomeDir()}/xampp/`;
// const DEFAULT_DIR =  './test_zip/2/php/';
console.log('welcome to xupg')

async function main(){
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

    let user_dir = options.dir ?? DEFAULT_DIR
    console.log(process.argv);
    switch(process.platform)
    {
        case 'win32': 
            console.log('running on windows machine')
        break;
        default: 
            console.error('not avaliable for your os =>', process.platform)
            console.log('we are currently building one for it')
            const _p = process.env.NODE_ENV || 'development'
            if(_p != 'development') exit(1)
            console.log(_p)
        break;
    }
    if(options.php)
    {
        console.log('hello')
        return await updatePHP(options.dir ?? DEFAULT_DIR, options.cache)
        .then(d => {
            if(d) console.log("php update successfull")
        })
        .catch(e => {
            console.error('Fial to update php',e) 
            throw e;     
        })
    }
    return true;
}
console.time('main')
main()
.then((d) => {
    d ? console.log('Ended successfully in') : console.warn('Ended unsucessfully in')
})
.catch((e) => {
    console.log('An error occured', e)
})
.finally(() => {
    console.timeEnd('main')
})