/**
 * @flow
 */
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {withRouter, matchPath} from 'react-router'
import {push} from 'react-router-redux'
import _ from 'lodash'
// Import main views
import Sidebar from 'components/parts/Sidebar'
import Footer from 'components/parts/Footer'
import Header from 'components/parts/Header'
// Import actions
import {CLOSE_SIDEBAR, OPEN_SIDEBAR, WINDOW_RESIZE} from 'actions/layout'
import {LOGOUT_AUTH} from 'actions/auth'
import {getAuthState, getLayoutState} from 'selectors'
import {getWindowInnerWidth} from 'const'
// Import styled components
import {
	PageLayout,
	MainLayout,
	MainContent,
	SidebarSemanticPusherStyled,
	SidebarSemanticPushableStyled,
	MainContainer,
	StyledDimmer
} from './style'
import type {RouteItem} from 'types'
import type {GlobalState} from 'reducers'

type Props = {
	children: React$Node,
	// Routes of app passed as props in `Root`
	routes: Array<RouteItem>,
	// React-router `withRouter` props
	location: any,
	history: any,
	// SidebarOpened can force component to re-render
	sidebarOpened: boolean,
	closeSidebar: Function,
	// IsLoggedIn can force component to re-render
	isLoggedIn: boolean,
	handleWindowResize: Function,
	logout: Function,
	checkAuthLogic: Function,
	toggleSidebar: Function,
	// IsMobile can force component to re-render
	isMobile: string,
	isMobileXS: boolean,
	isMobileSM: boolean
}

class App extends Component {
	props: Props
	componentWillMount () {
		const {isLoggedIn} = this.props
		if (process.env.BROWSER) {
			const {handleWindowResize} = this.props
			handleWindowResize()
			window.addEventListener('resize', handleWindowResize)
		}
		this.checkAppAuthLogic(isLoggedIn)
	}

	/**
   * Checks that user is still allowed to visit path after props changed
   * @param  {Object} nextProps
   */
	componentWillReceiveProps (nextProps) {
		this.checkAppAuthLogic(nextProps.isLoggedIn)
	}

	componentDidMount () {
		// NOTE: uncomment if you use Sentry
		// if (process.env.SENTRY_PUBLIC_DSN) {
		// 	const script = document.createElement('script')
		// 	script.type = 'text/javascript'
		// 	script.crossorigin = 'anonymous'
		// 	script.async = true
		// 	script.onload = () => {
		// 		Raven.config(process.env.SENTRY_PUBLIC_DSN).install()
		// 	}
		// 	script.src = 'https://cdn.ravenjs.com/3.16.1/raven.min.js'
		// 	document.body.appendChild(script)
		// }
		//
		// NOTE: uncomment if you use Google Analytics
		// if (process.env.GA_ID) {
		// 	const script = document.createElement('script')
		// 	script.type = 'text/javascript'
		// 	script.async = true
		// 	script.crossorigin = 'anonymous'
		// 	script.onload = () => {
		// 		window.ga =
		// 			window.ga ||
		// 			function () {
		// 				;(ga.q = ga.q || []).push(arguments)
		// 			}
		// 		ga.l = Number(new Date())
		// 		ga('create', process.env.GA_ID, 'auto')
		// 		ga('send', 'pageview')
		// 	}
		// 	script.src = 'https://www.google-analytics.com/analytics.js'
		// 	document.body.appendChild(script)
		// }
	}

	/**
     * Check that user is allowed to visit route
     * @param  {Boolean} isLoggedIn state.auth.me.isLoggedIn, current prop
     * @return {Void}
     */
	checkAppAuthLogic (isLoggedIn: boolean) {
		const path: string = this.props.location.pathname
		this.props.checkAuthLogic(path, isLoggedIn)
	}

	/**
   * Returns routing for sidebar menu
   * @return {Array} array of routes that will be rendered in sidebar menu
   */
	getSidebarRouting (): Array<RouteItem> {
		const sidebarRouting = this.props.routes
			.filter((a: RouteItem) => a.sidebarVisible)
			.map((a: RouteItem): RouteItem => {
				const {path, name, icon, external, strict, exact} = a
				const b: RouteItem = {path, name, icon, external, strict, exact}
				return b
			})
		return sidebarRouting
	}

	/**
  * Returns title for header
  * @param  {String} pathname - location.pathname
  * @return {String} page title
  */
	getPageTitle (pathname: string) {
		const {routes} = this.props
		const currentRoute: Object =
			_.find(routes, (a: RouteItem) => matchPath(pathname, a)) || {}
		const title: string = currentRoute.name || '404'
		return title
	}

	render () {
		const {
			children,
			sidebarOpened,
			closeSidebar,
			isLoggedIn,
			logout,
			toggleSidebar,
			location,
			isMobile
		} = this.props

		// Routing for sidebar menu
		const sidebarRouting = this.getSidebarRouting()
		const title: string = this.getPageTitle(location.pathname)

		const sidebarProps = {
			isMobile,
			logout,
			open: sidebarOpened,
			routing: sidebarRouting
		}

		const headerProps = {
			toggleSidebar,
			title,
			isLoggedIn,
			isMobile
		}

		const dimmerProps = {
			//  Dimmed: true,
			active: isLoggedIn && sidebarOpened,
			page: true,
			//  Blurring: true,
			//  page: true,
			onClick: closeSidebar
		}

		// {/* XXX: There is an issue with props and styled-components, so we use .extend and re-render the component when isMobile/isLoggedIn change triggered. Using `style` attribute isn't a good solution.
		//   Please, check: https://github.com/styled-components/styled-components/issues/439 */}
		//   {/* <SidebarSemanticPusherStyled style={SidebarSemanticPusherStyleProps}> */}
		const SidebarSemanticPusherStyledPatch =
			!isMobile && isLoggedIn
				? SidebarSemanticPusherStyled.extend`
						max-width: calc(100% - 150px);
					`
				: SidebarSemanticPusherStyled

		return (
			<PageLayout>
				<SidebarSemanticPushableStyled>
					{isLoggedIn && <Sidebar {...sidebarProps} />}
					<SidebarSemanticPusherStyledPatch>
						<StyledDimmer {...dimmerProps} />
						<Header {...headerProps} />
						<MainLayout>
							<MainContent>
								<MainContainer id="main-container">
									{children}
								</MainContainer>
							</MainContent>
							<Footer />
						</MainLayout>
						{/* </Dimmer.Dimmable> */}
					</SidebarSemanticPusherStyledPatch>
				</SidebarSemanticPushableStyled>
			</PageLayout>
		)
	}
}

function mapStateToProps (state: GlobalState) {
	const layoutState = getLayoutState(state)
	const authState = getAuthState(state)
	const {sidebarOpened, isMobile, isMobileXS, isMobileSM} = layoutState
	const {isLoggedIn} = authState
	return {
		sidebarOpened,
		isMobile,
		isMobileXS,
		isMobileSM,
		isLoggedIn
	}
}

function mapDispatchToProps (dispatch) {
	let resizer
	return {
		closeSidebar () {
			dispatch(CLOSE_SIDEBAR())
		},
		logout () {
			dispatch(LOGOUT_AUTH())
		},
		toggleSidebar () {
			dispatch(OPEN_SIDEBAR())
		},
		/**
         * Immediately push to homePath('/'), if user is logged.
         * Can be used for other auth logic checks.
         * Useful, because we don't need to dispatch `push(homePath)` action
         * from `Login` container after LOGIN_AUTH_SUCCESS action
         * @param  {String}  path       [current location path]
         * @param  {Boolean} isLoggedIn [is user logged in?]
         */
		checkAuthLogic (path: string, isLoggedIn: boolean) {
			const authPath = '/auth'
			const homePath = '/'
			if (isLoggedIn && path === authPath) {
				dispatch(push(homePath))
			}
		},
		handleWindowResize () {
			clearTimeout(resizer)
			const innerWidth: number = getWindowInnerWidth(window)
			resizer = setTimeout(() => dispatch(WINDOW_RESIZE(innerWidth)), 150)
		}
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))
