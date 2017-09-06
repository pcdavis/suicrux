/**
 * @flow
 */

import {
	getLocalToken,
	resetLocalToken
} from 'api/LocalStorageCookiesSvc'
import _ from 'lodash'

/**
 * Create request wrapper for certain method
 * @param  {String} method - Request method
 * @return {Function}
 */
const requestWrapper = (
	method: 'GET' | 'POST' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PUT' | 'PATCH'
) => {
	/**
	 * Creates request to `url` with `data`
	 * @param  {String} 	url        				Request URL
	 * @param  {Object} 	[data= null]			Data for Request
	 * @param  {Object} 	[options= {}]			Additional options
	 * @param  {Function} [cb = (a) => a]		Transform request before it will be sent
	 * @return {Object}             				Request response
	 */
	return async (
		url: string,
		data: Object | null = null,
		options: Object = {},
		cb: (request: Object) => Object = a => a
	) => {
		// get decorated url and request params
		const {URL, request} = decorateRequest({method, url, data, options, cb})
		// create request!
		return fetch(URL, request)
			.then(checkStatus)
			.then(parseJSON)
			.catch((err: string) => {
				console.error(err)
				return err
			})
	}
}

/**
 * middlewares
 * 1. parse response
 * 2. add "ok" property to result
 * 3. return request result
 * @param  {Object} res - Response from resource
 * @return {Object} response result with "ok" property
 */
async function parseJSON (res: Response): Object {
	let json: Object
	// status response field in return object
	try {
		json = await res.json()
	} catch (e) {
		if (res.status === 204) {
			return {ok: true, data: {}}
		}
		return {ok: false}
	}
	if (!res.ok) {
		return {data: json, ok: false}
	}
	return {data: json, ok: true}
}

/**
 * Checks response status
 * @param  {Object} response - Response
 * @return {Object}          - Response
 */
function checkStatus (response: Response): Response {
	const {status} = response
	if (status >= 200 && status < 300) {
		// Everything is ok
	} else if (status >= 300 && status < 400) {
		// 300 Multiple Choices
		// 301 - Moved Permanently,
		// 302 - Found, Moved Temporarily
		// 304 - not modified
		// 307 - Temporary Redirect
	} else if (status === 400) {
		// Probably is a validation error
	} else if (status === 403 || status === 401) {
		// 401 - Forbidden
		// 403 - Unauthorized
		// remove local token in this case
		resetLocalToken()
	} else if (status === 404) {
		// Not Found
	} else if (status >= 500) {
		// Server error
	}
	return response
}

/**
 * Create
 * @param  {String} method 			 -	Request method
 * @param  {String} url 				 -  Request URL
 * @param  {Object} [data= null] -	Data for Request
 * @return {Object}        			 - 	Decorated request params
 */
function decorateRequest ({method, url, data, options, cb}): Object {
	// Default params for fetch = method + (Content-Type)
	const defaults = {
		method,
		headers: {}
	}
	const token: string | null = getLocalToken()
	const isRequestToExternalResource = /(http|https):\/\//.test(url)
	const URL = isRequestToExternalResource ? url : process.env.BASE_API + url

	const requestAuthDecoration =
		!isRequestToExternalResource && token
			? {headers: {Authorization: `JWT ${token}`}}
			: {}

	const requestHeadersDataDecoration = getHeaderDataDecoration(data)

	const request = _.merge(
		{},
		defaults,
		requestAuthDecoration,
		requestHeadersDataDecoration
	)

	if (!isRequestToExternalResource) {
		console.log(`Request ${url} was sent to our domain`, request)
	} else {
		console.log(`Request ${url} was sent to external domain`, request)
	}

	return {
		request,
		URL
	}
}

function getHeaderDataDecoration (data): Object {
	const requesDataDecoration = data ? {body: JSON.stringify(data)} : {}

	const requestContentTypeDecoration =
		data instanceof FormData
			? {}
			: {headers: {'Content-Type': 'application/json; charset=UTF-8'}}

	return {...requesDataDecoration, ...requestContentTypeDecoration}
}

export const get = requestWrapper('GET')
export const post = requestWrapper('POST')
export const put = requestWrapper('PUT')
export const patch = requestWrapper('PATCH')
export const del = requestWrapper('DELETE')

// USAGE:
// get('https://www.google.com', options)
//
// post('https://www.google.com', data, options)
