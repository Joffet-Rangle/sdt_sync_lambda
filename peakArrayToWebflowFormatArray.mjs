import { createRequire } from "module";
import dayjs from "dayjs";
const require = createRequire(import.meta.url);
const dataConversionDict = require("./dataConversionDict.json");

export const peakArrayToWebflowFormatArray = (
	dataType,
	peakDataArray,
	existingWebflowDepartures = null
) => {
	const specificDict = dataConversionDict[dataType.replace("Test", "")];
	if (!specificDict) return [];

	const newArray = [];
	for (let index = 0; index < peakDataArray.length; index++) {
		const peakItem = peakDataArray[index];
		// start new item with webflow required fields
		const newItem = {
			_archived: false,
			_draft: false,
		};

		// add tour days for departures if not present in Peak data
		if (
			dataType === "departures" &&
			peakItem.startdate &&
			peakItem.enddate &&
			!peakItem.p15_tourdays
		) {
			const start = dayjs(new Date(peakItem.startdate));
			const end = dayjs(new Date(peakItem.enddate));
			newItem.tourdays = end.diff(start, "day");
		}

		// if is Trip add the webflowIds for associated depatures
		if (dataType === "trips" && existingWebflowDepartures) {
			const matchingDepartures = existingWebflowDepartures.filter(
				(e) => e.tripsidp15 === peakItem.p15_tripsid._text
			);
			newItem.departures = matchingDepartures.map((e) => e.webflowId);
		}

		// if departure and no webflow tripid is added (like if it's a new trip that hasn't been synced yet), then do not add the departure. It will get caught on the next sync
		// if (dataType === "departures" && !newItem.tripsid) {
		// 	continue;
		// }

		// iterate through each key in the specific dictionary, adding the value to the newItem
		for (let index = 0; index < Object.keys(specificDict).length; index++) {
			const key = Object.keys(specificDict)[index];
			const keyConversionHash = specificDict[key];
			if (!keyConversionHash || !peakItem[key]) continue;
			let value = keyConversionHash.isAttributeName
				? peakItem[key]._attributes.name
				: peakItem[key]._text;
			if (keyConversionHash.isInteger) value = parseInt(value);
			newItem[keyConversionHash.webflowString] = value;
		}
		newArray.push(newItem);
	}
	return newArray;
};
