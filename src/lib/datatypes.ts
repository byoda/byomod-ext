export enum SocialAccountStoredStatus {
    BLOCKED = 'BLOCKED',
    UNBLOCKED = 'UNBLOCKED',
    NEW = 'NEW',
    ATTEMPTED = 'ATTEMPTED',
}


export interface iSocialNetworkAuth {
    name: string
    jwt: string | undefined

    // Twitter uses CSRF Tokens
    csrf_token: string | undefined

    // Twitter GraphQL APIs use a token in the GET URL, ie.
    // https://x.com/i/api/graphql/<token>/BlockedAccounts
    graphql_token: string | undefined
}

export interface iSocialAccountPush {
    list: string,
    accounts: iSocialAccount[]
}

export interface iAccountStat {
    timestamp: Date;
    followers: number;
    assets: number;
    views: number;
}

export interface iByoList {
    meta: iByoListMeta
    block_list: iBlockEntry[]
    trust_list: string[]
}

export interface iByoListMeta {
    author_email: string
    author_name: string
    author_url: string
    categories: iByoListCategory[]
    list_name: string
}

export interface iByoListCategory {
    name: string
    description: string
}

export interface iSocialAccount {
    platform: string
    handle: string
    url: string
    is_primary: boolean
}

export interface iBlockEntry {
    first_name: string
    last_name: string
    business_name: string
    business_type: string
    status: string
    languages: string[]
    categories: iByoListCategory[]
    annotations: string[]
    urls: string[]
    social_accounts: iSocialAccount[]
}

export interface iListOfLists {
    lists: string[]
}