# xUPG 
> WHat is xUPG

**xUPG** is a CLI TOOL that makes it easy to upgrade your xampp modules ( PHP, MYSQL, PHPMYADMIN ) using the ClI.

> How does xUPG work ?

xUPG makes use of [sourceforge API](https://sourceforge.net/p/forge/documentation/API/) to manage and dowload updates

> How to use xUPG
To you xUPG you have to insatll it globally from [npmjs](https://npmjs.com/package/xUPG)
### Prerequisites
- [Nodejs](https://nodejs.org/en/)
- [npm](https://npmjs.com)
- [xampp](https://www.apachefriends.org/index.html)

### How to Install
To install **xUPG** you have to run the following command in your terminal

```bash 
npm i -g xupg
```

This command will install **xUPG** globally on your machine

### How to use

#### Upgrading php version
```shell
xupg -p
```
OR
```shell
xupg --php
```
This command will upgrade your php version to the latest version available on sourceforge
#### Upgrading mysql version
```shell
xupg -ms
```
OR
```shell
xupg --mysql
```
This command will upgrade your mysql version to the latest version available on sourceforge and will also backup your database before upgrading
#### Upgrading phpmyadmin version
```shell
xupg -ph
```
OR
```shell
xupg --phpmyadmin
```
This command will upgrade your phpmyadmin version to the latest version available on sourceforge

#### Upgrading all modules
```shell
xupg -f
```
OR
```shell
xupg --full
```
This command will upgrade all your modules to the latest version available on sourceforge

### HOW TO SET YOUR XAMPP INSTALLATION DIRECTORY
To set your xampp installation directory you have to run the following command in your terminal
```shell
xupg -p -d <path to your xampp installation directory>
```
OR
```shell
xupg -p --dir <path to your xampp installation directory>
```
This command will set your xampp installation directory to the path you specified

### ALL FLAGS
| Flag | Description |
| ------ | ------ |
| -p, --php | Upgrade php version |
| -ms, --mysql | Upgrade mysql version |
| -ph, --phpmyadmin | Upgrade phpmyadmin version |
| -f, --full | Upgrade all modules |
| -d, --dir | Set xampp installation directory |
| -h, --help | Show help |

### upgradables xampp modules
- [x] PHP
- [ ] MYSQL
- [ ] PHPMYADMIN

### OS SUPPORT
- [x] Windows
- [ ] Linux
- [ ] Mac

### License
MIT

### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

### Author
- [Chibueze Aniezeofor](https://github.com/codad5)

> Built by [codad5](https://github.com/codad5)