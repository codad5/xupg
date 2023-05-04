# xUPG 
> A easy way to upgrade your XAMPP PHP version (comming soon for mysql, phpmyadmin)

This is a CLI tool using [sourceforge API](https://sourceforge.net/p/forge/documentation/API/) that helps to update the XAMPP modules (PHP, PHPmyadmin,MariaDB) in your machine

### Installation
```bash 
npm i -g xupg
```

### HOw to Use

#### Upgrading php version
```shell
xupg -p
```

#### All Flags 
- `-p` : TO upgrade PHP 
- `-ph` : To Upgrade PHPmyadmin
- `-c` : use local cache
- `-d <path_to_xampp>` : If not using default xampp path `c:/xampp` for windows

### Currently upgradeable modules
- [x] PHP
- [ ] PHPmyadmin
- [ ] MariaDB / MYSQL
- [ ] FileZilla FTP
- [ ] others

### Currently supported os
- [x] Windows
- [ ] linux
- [ ] Mac

> Built by [codad5](https://github.com/codad5)