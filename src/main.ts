#! /usr/bin/env node

import { Command } from "commander"
import { getHomeDir, getVersion, updatePHP } from "./helper";
import fs from 'fs'

const program = new Command;
const DEFAULT_DIR = `${getHomeDir()}/xampp/`;
console.log('welcome to xupg')

program
.name("xupg (upgrade your xampp php version")
.version(getVersion())
.description('upgrade your xampp version')
.option("-p, --php", "Upgrade current php version")
.option('-ph --phpmyadmin', "upgrade phpmyadmin")
.option('-f --full', "Upgrade full php version")
.option('-d --dir <value>', "Select your xampp installation directory")

const options = program.opts();

let user_dir = options.dir ?? DEFAULT_DIR

// if(options.php)
// {
    console.log('hello')
    updatePHP(options.dir ?? './test/2/php')
// }

console.log('###################################### 100%')
console.log('done')