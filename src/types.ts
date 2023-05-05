export type _Modules = 'full' | 'php'
export type InstallOptions = {
    php : boolean,
    phpmyadmin: boolean,
    // mysql: boolean,
    all:boolean
} 

export type XamppInfoData = {
    href : string ,
    version : versionNumber,
    file_name: string 
}

export type versionNumber = `${number}.${number}.${number}`