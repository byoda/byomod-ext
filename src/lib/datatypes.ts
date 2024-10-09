export interface iMessage<Type> {
    source: string;
    type: string;
    data: Type;
};

export interface iSocialNetworkAuth {
    name: string;
    jwt: string | undefined;
    csrf_token: string | undefined;
};

export class SocialNetwork {
    name: string;
    url: string;
    jwt: string | undefined;
    csrf_token: string | undefined;

    constructor(name: string, url: string, jwt: string | undefined = undefined,
                csrf_token: string | undefined = undefined) {
        this.name = name;
        this.url = url;
        this.jwt = jwt;
        this.csrf_token = csrf_token;
    }

    get_keyname(key: string): string {
        return `${this.name}_${key}`
    }
};

export interface iByoList {
    meta: iByoListMeta;
    block_list: iBlockEntry[];
    trust_list: string[];
}

export interface iByoListMeta {
    author_email: string;
    author_name: string;
    author_url: string;
    categories: iByoListCategory[];
}

export interface iByoListCategory {
    name: string;
    description: string;
}

export interface iSocialAccount {
    platform: string;
    handle: string;
    url: string;
    is_primary: boolean;
}
export interface iBlockEntry {
    first_name: string;
    last_name: string;
    business_name: string;
    business_type: string;
    status: string;
    languages: string[];
    categories: iByoListCategory[];
    annotations: string[];
    urls: string[];
    social_accounts: iSocialAccount[];
}

// This type is used by the socialNetworks constant in constants.ts
export interface Dictionary<T> {
    [key: string]: T
};

export interface iListOfLists {
    lists: string[];
}