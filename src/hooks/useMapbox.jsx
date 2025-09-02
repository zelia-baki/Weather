import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

const useMapbox = ({ longitude, latitude, onPolygonChange, onPlaceSelect }) => {
    const mapContainerRef = useRef();
    const mapRef = useRef();
    const drawRef = useRef();
    const [roundedArea, setRoundedArea] = useState();

    useEffect(() => {
        mapboxgl.accessToken = "pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q";

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/satellite-v9",
            center: [longitude, latitude],
            zoom: 8,
        });
        mapRef.current = map;

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: { polygon: true, trash: true },
            defaultMode: "draw_polygon",
        });
        map.addControl(draw);
        drawRef.current = draw;

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            zoom: 4,
            placeholder: "Search coordinates",
            mapboxgl: mapboxgl,
            reverseGeocode: true,
        });

        map.addControl(geocoder);

        geocoder.on("result", (e) => {
            onPlaceSelect?.(e.result);
            map.flyTo({ center: e.result.geometry.coordinates, zoom: 15 });
        });

        const updateArea = () => {
            const data = draw.getAll();
            if (data.features.length > 0) {
                const area = turf.area(data);
                setRoundedArea(Math.round(area * 100) / 100);
                onPolygonChange?.(data.features[0].geometry.coordinates);
            } else {
                setRoundedArea(undefined);
            }
        };

        map.on("draw.create", updateArea);
        map.on("draw.delete", updateArea);
        map.on("draw.update", updateArea);
    }, [longitude, latitude]);

    return { mapContainerRef, mapRef, drawRef, roundedArea };
};

export default useMapbox;
