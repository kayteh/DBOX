import api from '../Api'
import { routeActions } from 'react-router-redux'
import { Map } from 'immutable'

import * as dashboardActions from './dashboard'

const defaultTime = 900 // 15 minutes

const initialState = {
	
	// Round Data
	round: 0,
	roundScores: Map({
		1: 0, // VS 
		2: 0, // NC
		3: 0, // TR
	}),

	// Match Data
	matchScores: Map({
		1: 0, // VS 
		2: 0, // NC
		3: 0, // TR
	}),

	// Match Meta
	matchID: 1,

	// Clock
	secondsLeft: 900,
	clockInterval: null,
	clockState: 'stopped',
}

export default function reducer(state = initialState, {type, data}) {
	console.log(type, data)

	switch(type) {

		case 'm:initial': 

			return {
				...state,
				...data.match,
			}

		case 'm:clock_state':

			return {
				...state,
				clockState: data.state
			}

		case 'm:clock_time':

			return {
				...state,
				secondsLeft: data.secondsLeft
			}

		case 'm:clock_intv':

			return {
				...state,
				clockInterval: data.intv
			}

		case 'm:score_increment':

			return {
				...state,
				roundScores: state.roundScores.set(data.faction, state.roundScores.get(data.faction) + 1),
				matchScores: state.matchScores.set(data.faction, state.matchScores.get(data.faction) + 1),
			}

		default:

			return state

	}
}

export function getMatchInfo(id) {
	return function(dispatch) {
		api.match.get(id).then((data) => {

			if (data.status !== 200) {
				// dispatch(dashboardActions.error(data))
				return
			}

			dispatch({ type: 'm:initial', data: { match: data.body } })
			// dispatch(dashboardActions.initializeMatchData(data.body))
		}, (err) => {
			throw err
		})
	}
}

export function scoreIncrement(faction) {
	return function(dispatch) {
		dispatch({type: 'm:score_increment', data: { faction }})
	}
}

export function clockNextRound() {
	return function(dispatch, getState) {
		let { match: { matchID } } = getState()

		api.match.round.post(matchID, { next: true }).then((data) => {
			console.log(data)
		}, (err) => {
			throw err
		})

	}
}

export function clockStart() {
	return function(dispatch, getState) {
		let { match: { matchID } } = getState()

		console.log('clockStart', matchID)

		api.match.clock.post(matchID, { state: 'started' }).then((data) => {
			console.log(data.ok)
		})

	}
}

export function clockStop() {
	return function(dispatch, getState) {
		let { match: { matchID } } = getState()

		console.log('clockStop', matchID)

		api.match.clock.post(matchID, { state: 'stopped' }).then((data) => {
			console.log(data.ok)
		})
	}
}

export function clockReset() {
	return function(dispatch, getState) {
		let { match: { matchID } } = getState()

		console.log('clockReset', matchID)

		api.match.clock.reset(matchID).then((data) => {
			console.log(data.ok)
		})
	}
}

export function clockStartTimer() {
	return function(dispatch, getState) {

		let intv = setInterval(() => {
			let { match: { secondsLeft, clockInterval } } = getState()
			
			if (secondsLeft > 0) {
				dispatch({ type: 'm:clock_time', data: { secondsLeft: secondsLeft-1 } })
			} else {
				clearInterval(clockInterval)
			}

		}, 1000)

		dispatch({ type: 'm:clock_intv', data: { intv } })

	}
}

export function clockStopTimer() {
	return function(dispatch, getState) {

		let { match: { clockInterval } } = getState()

		clearInterval(clockInterval)

	}
}

export function clockInit() {
	return function(dispatch, getState) {

		let { match: { matchID } } = getState()

		api.match.clock.get(matchID).then((r) => {
			let data = r.body

			dispatch({ type: 'm:clock_time', data: { secondsLeft: data.time } })
			dispatch({ type: 'm:clock_state', data: { state: data.state } })
			if ( data.state === 'started' ) {
				dispatch(clockStartTimer())
			}
		})

	}
}