import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import * as tj from "togeojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./KMLViewer.css";

const KMLViewer = () => {
    const [geoJson, setgeo] = useState(null);
    const [summary, setSum] = useState(null);
    const [details, setdet] = useState(null);
    const [error, Error] = useState(null);
    const [showSummary, setShow] = useState(false);
    const [showDetails, setDetails] = useState(false);
    const mapRef = useRef();

    const handlefile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parser = new DOMParser();
                const kml = parser.parseFromString(e.target.result, "text/xml");

                if (!kml) {
                    console.error("Invalid KML file.");
                    return;
                }


                const GeoJson = tj.kml(kml);

                if (!GeoJson || !GeoJson.features || GeoJson.features.length === 0) {
                    throw new Error("Invalid or empty KML file.");
                }

                setgeo(GeoJson);
                genSummary(GeoJson);
                genDetails(GeoJson);
                Error(null);
                setShow(false);
                setDetails(false);
            } catch (err) {
                Error("Error processing KML file: " + err.message);
                setgeo(null);
                setSum(null);
                setdet(null);
                setShow(false);
                setDetails(false);
            }
        };
        reader.readAsText(file);
    };

    const genSummary = (geoJsonData) => {
        const summaryCount = {};
        geoJsonData.features.forEach((feature) => {
            const type = feature.geometry?.type;
            if (type) {
                summaryCount[type] = (summaryCount[type] || 0) + 1;
            }
        });
        setSum(summaryCount);
    };

    const genDetails = (geoJsonData) => {
        const detailsData = {};
        geoJsonData.features.forEach((feature) => {
            const type = feature.geometry?.type;

            if (type === "LineString" || type === "MultiLineString") {
                const coordinates = feature.geometry.coordinates;
                if (!Array.isArray(coordinates) || coordinates.length < 2) return;
                let length = 0;
                for (let i = 0; i < coordinates.length - 1; i++) {
                    const point1 = L.latLng(coordinates[i][1], coordinates[i][0]);
                    const point2 = L.latLng(coordinates[i + 1][1], coordinates[i + 1][0]);
                    length += point1.distanceTo(point2);
                }
                detailsData[type] = (detailsData[type] || 0) + length;
            }

            if (type === "Polygon" || type === "MultiPolygon") {
                let perimeter = 0;
                let coordinates = feature.geometry.coordinates;

                if (type === "MultiPolygon") {
                    coordinates = coordinates.flat();
                }

                coordinates.forEach((polygon) => {
                    for (let i = 0; i < polygon.length - 1; i++) {
                        const point1 = L.latLng(polygon[i][1], polygon[i][0]);
                        const point2 = L.latLng(polygon[i + 1][1], polygon[i + 1][0]);
                        perimeter += point1.distanceTo(point2);
                    }
                    const point1 = L.latLng(polygon[polygon.length - 1][1], polygon[polygon.length - 1][0]);
                    const point2 = L.latLng(polygon[0][1], polygon[0][0]);
                    perimeter += point1.distanceTo(point2);
                });

                detailsData[type] = (detailsData[type] || 0) + perimeter;
            }
        });
        setdet(detailsData);
    };

    useEffect(() => {
        if (geoJson && mapRef.current) {
            const bounds = L.geoJSON(geoJson).getBounds();
            mapRef.current.fitBounds(bounds);
        }
    }, [geoJson]);

    return (
        <div className="container">
            <h2>KML Viewer</h2>
            <input type="file" className="file-input" accept=".kml" onChange={handlefile} />
            {error && <p className="error">{error}</p>}
            <div className="buttons">
                <button onClick={() => setShow(true)}>Summary</button>
                <button onClick={() => setDetails(true)}>Details</button>
            </div>
            {showSummary && summary && (
                <div className="summary">
                    <h3>Summary</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Element Type</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(summary).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showDetails && details && (
                <div className="details">
                    <h3>Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Element Type</th>
                                <th>Total Length/Perimeter (m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(details).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{value.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <MapContainer
                center={[20, 0]}
                zoom={2}
                className="map-container"
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {geoJson && <GeoJSON data={geoJson} />}
            </MapContainer>
        </div>
    );
};

export default KMLViewer;