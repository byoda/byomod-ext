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

export interface iListOfLists {
    lists: string[];
}