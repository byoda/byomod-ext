// all interfaces and classes related to a BYOMod list

import * as fs from 'fs';

import * as yaml from 'js-yaml';

import ByoStorage from './storage';
import type {iByoList} from './datatypes';

export interface iAccountStat {
    timestamp: Date;
    followers: number;
    assets: number;
    views: number;
}


export default class ByoList {
    storage: ByoStorage;
    url: URL | undefined;
    list: iByoList | undefined;

    constructor(url: string | URL) {
        this.storage = new ByoStorage();
        this.url = undefined;

        if (typeof url === 'string') {
            url = new URL(url);
        }
        this.url = url as URL;
    }

    async initialize(): Promise<boolean> {
        if (this.url === undefined) {
            console.error('No URL set for ByoList');
            return false;
        }
        try {
            await this.load();
            if (this.list === undefined) {
                return false;
            }
            if (this.list.block_list === undefined) {
                this.list.block_list = []
            }
            return true;
        } catch (e) {
            console.log(`Could not load from storage: ${this.url.href}`);
        }
        try {
            await this.download();
            await this.save();
            return true;
        } catch (e) {
            console.error('Could not download: ', this.url.href, e);
        }
        return true;
    }


    get_keyname(key: string): string {
        return `${key}`;
    }

    async load(): Promise<number> {
        let key: string = this.get_keyname(`list_${this.url!.href}`);
        let data: iByoList = await this.storage.get(key) as iByoList;
        this.list = data;
        console.log('Loaded list:', key, 'with', this.list!.block_list.length, 'entries');
        if (this.list === undefined || this.list.block_list === undefined) {
            this.list = {
                meta: {
                    author_email: '',
                    author_name: '',
                    author_url: '',
                    categories: []
                },
                block_list: [],
                trust_list: []
            };
        }

        return this.list.block_list.length;
    }

    async save() {
        let key: string = this.get_keyname(`list_${this.url!.href}`);
        if (this.list === undefined) {
            console.log('No data in the list to save');
            return;
        }
        console.log(`Saving list: ${key}`);
        this.storage.set_sync(key, this.list);
    }

    async download() {
        let response: Response = await fetch(this.url!.href);
        if (response.status === 200) {
            let text: string = await response.text();
            this.list = yaml.load(text) as iByoList;
            console.log(
                'Downloaded list:', this.url!.href, 'with',
                this.list!.block_list.length, 'entries'
            );
        };
    }

    // Used for test purposes
    from_file(filename: string): number {
        let text: string = fs.readFileSync(filename, 'utf8');
        let data: iByoList = yaml.load(text) as iByoList ;
        this.list = data;
        return this.list.block_list.length;
    }
}
