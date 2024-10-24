import browser from 'webextension-polyfill';

import type {iSocialNetworkAuth} from '../lib/datatypes'

import {SOCIAL_NETWORKS_BY_DOMAIN} from '../lib/constants'

import SecretStore from '../lib/secret_store/secret_store'

const TWITTER_GRAPHQL_PREFIX = 'https://x.com/i/api/graphql/'

let TWITTER_JWT: AuthToken | undefined = undefined
let TWITTER_CSRF_TOKEN: AuthToken | undefined = undefined
let TWITTER_GRAPHQL_TOKEN: AuthToken | undefined = undefined

const TokenExpiration: number = 60 * 60 * 24


class AuthToken {
    type: string
    value: string | undefined
    expiration: number | undefined
    platform: string = 'twitter'

    constructor(type: string,
                value: string | undefined,
                expiration: number = TokenExpiration,
                platform: string = 'twitter') {
        this.type = type
        this.value = value
        this.platform = platform
        this.expiration = expiration
    }
}

export default function grab_auth_tokens(secret_store: SecretStore, details: browser.WebRequest.OnSendHeadersDetailsType) {
    let url: URL = new URL(details.url)
    let fqdn: string = url.hostname.toLowerCase()

    let social_domain: string | undefined = get_social_domain(fqdn)
    if (social_domain === undefined ) {
        console.log('No supported social network for domain: ' + fqdn)
        return
    }

    let network_auth: iSocialNetworkAuth = {
        name: SOCIAL_NETWORKS_BY_DOMAIN.get(social_domain)!.name,
        jwt: undefined,
        csrf_token: undefined,
        graphql_token: undefined
    }

    let headers: browser.WebRequest.HttpHeaders | undefined = details.requestHeaders
    if (headers == undefined) {
        // console.log('No headers found!')
        return
    }

    for (let i = 0, l = headers.length; i < l; ++i) {
        if (headers[i].name === 'authorization') {
            network_auth.jwt = headers[i].value
        }
        else if (headers[i].name === 'x-csrf-token') {
            network_auth.csrf_token = headers[i].value
        }
    }
    if (network_auth.jwt == undefined
            || network_auth.csrf_token == undefined) {
        // console.log(`Unauthenticated API call to ${url.href}`)
        return
    }

    // We're not using GraphQL tokens yet for Twitter/X
    // network_auth.graphql_token = extract_twitter_graphql_token(url.href)

    let now: number = Math.round(Date.now() / 1000)

    if (network_auth.name == 'Twitter') {
        if (TWITTER_JWT != undefined && TWITTER_CSRF_TOKEN != undefined
                && TWITTER_GRAPHQL_TOKEN != undefined
                && TWITTER_JWT.expiration! > now
                && TWITTER_CSRF_TOKEN.expiration! > now
                && TWITTER_GRAPHQL_TOKEN.expiration! > now) {
            // console.log('JWT and CSRF token already found for Twitter and they have not yet expired!')
            return
        }
    } else {
        console.log(`We do not yet support auth tokens for social network: ${network_auth.name}`)
        return
    }

    // console.log(`JWT: ${network_auth.jwt}, CSRF Token: ${network_auth.csrf_token}, GraphQL Token: ${network_auth.graphql_token}, ${JSON.stringify(network_auth)}`)
    secret_store.upsert(network_auth, 'twitter')
}

function extract_twitter_graphql_token(href: string): string | undefined {
    // https://x.com/i/api/graphql/sOj2N04S8Mbza3y5M3fOIg/BlockedAccountsAll
    // console.log(`Extracting GraphQL token from ${href}`)
    if (! href.startsWith(TWITTER_GRAPHQL_PREFIX)) {
        // console.log('Not a Twitter GraphQL URL')
        return undefined
    }
    let graphql_token = href.substring(TWITTER_GRAPHQL_PREFIX.length)
    graphql_token = graphql_token.substring(0, graphql_token.indexOf('/'))

    return graphql_token
}

function get_social_domain(fqdn: string): string | undefined {
    let fqdn_parts: string[] = fqdn.split('.')
    if (fqdn_parts.length < 2) {
        return undefined
    }
    let tld: string = fqdn_parts[fqdn_parts.length - 1]
    let domain: string = fqdn_parts[fqdn_parts.length - 2]

    let social_domain: string = `${domain}.${tld}`
    if (!(SOCIAL_NETWORKS_BY_DOMAIN.has(social_domain))) {
        return undefined
    }
    return social_domain
}

export async function get_twitter_auth(secret_store: SecretStore): Promise<iSocialNetworkAuth> {
    let secrets = await secret_store.get_by_platform('twitter')
    let auth_tokens: iSocialNetworkAuth = {
        name: 'twitter',
        jwt: undefined,
        csrf_token: undefined,
        graphql_token: undefined
    }
    for (let secret of secrets) {
        if (secret.secret_type == 'jwt') {
            auth_tokens.jwt = secret.value
        } else if (secret.secret_type == 'csrf_token') {
            TWITTER_CSRF_TOKEN = new AuthToken(secret.secret_type, secret.value)
            auth_tokens.csrf_token = secret.value
        } else if (secret.secret_type == 'graphql_token') {
            TWITTER_GRAPHQL_TOKEN = new AuthToken(secret.secret_type, secret.value)
            auth_tokens.graphql_token = secret.value
        }
    }
    console.log(`Read from Secret store ${auth_tokens.jwt}, ${auth_tokens.csrf_token}`)
    return auth_tokens
}