/* leny/enigjewo
 *
 * /src/store/game/actions/start-round.js - Game Store Action: start round
 *
 * coded by leny@BeCode
 * started at 03/02/2021
 */

import {DEFAULT_DIFFICULTY} from "core/constants";
import {
    ACTION_PREPARE_ROUND,
    ACTION_SEND_ROUND_PARAMS,
    ACTION_START_ROUND,
} from "store/game/types";
import bbox from "@turf/bbox";

import {getRandomPanorama} from "core/street-view";
import {getGeoJSONDifficulty} from "core/geo-utils";
import {loadGeoJSON} from "core/maps";

import {db} from "core/firebase";

export default state => async dispatch => {
    const {
        code,
        settings: {map, isMulti},
        currentRound: {index},
    } = state;

    dispatch({type: ACTION_PREPARE_ROUND});

    const payload = {
        type: ACTION_START_ROUND,
        now: Date.now(),
        bounds: null,
        difficulty: DEFAULT_DIFFICULTY,
    };

    if (map === "world") {
        const {panorama, position} = await getRandomPanorama();
        payload.panorama = panorama;
        payload.target = position;
    } else {
        const geoJSON = await loadGeoJSON(map);
        const [west, south, east, north] = bbox(geoJSON);
        const difficulty = getGeoJSONDifficulty(geoJSON);
        const {panorama, position} = await getRandomPanorama(geoJSON);

        payload.panorama = panorama;
        payload.target = position;
        payload.bounds = {north, east, south, west};
        payload.difficulty = difficulty;
    }

    if (!isMulti) {
        dispatch({type: ACTION_START_ROUND, ...payload});
        return;
    }

    await db.ref(`games/${code}/settings`).update({
        bounds: payload.bounds,
        difficulty: payload.difficulty,
    });
    await db.ref(`games/${code}/rounds/rnd-${index}`).set({
        panorama: payload.panorama,
        target: payload.target,
    });
    await db.ref(`games/${code}/currentRound`).set({index});
    dispatch({type: ACTION_SEND_ROUND_PARAMS});
};
