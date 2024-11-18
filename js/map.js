// map.js - Complete map management implementation

import { Utils } from './utils.js';

export class MapManager {
    constructor(app) {
        this.app = app;
        this.map = null;
        
        // Layer groups
        this.layers = {
            stations: L.layerGroup(),
            readyCorridors: L.layerGroup(),
            pendingCorridors: L.layerGroup(),
            selectedStations: L.layerGroup(),
            route: L.layerGroup()
        };
        
        // Styling configurations
        this.styles = {
            readyCorridor: {
                color: '#2B8A3E',
                weight: 3,
                opacity: 0.8
            },
            pendingCorridor: {
                color: '#90C9A0',
                weight: 3,
                opacity: 0.8,
                dashArray: '5, 10'
            },
            station: {
                radius: 8,
                fillColor: '#2B8A3E',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            },
            selectedStation: {
                radius: 8,
                fillColor: '#1E4ED8',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            },
            route: {
                color: '#1E4ED8',
                weight: 4,
                opacity: 0.8
            }
        };

        this.initialize();
    }

    initialize() {
        // Create map instance
        this.map = L.map('map').setView([39.8283, -98.5795], 4);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add all layers to map
        Object.values(this.layers).forEach(layer => layer.addTo(this.map));
        
        // Add legend
        this.addLegend();
        
        // Initialize map event handlers
        this.initializeEventHandlers();
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML = `
                <h4>Legend</h4>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${this.styles.readyCorridor.color}"></div>
                    <span>Ready Corridor</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${this.styles.pendingCorridor.color}"></div>
                    <span>Pending Corridor</span>
                </div>
                <div class="legend-item">
                    <div class="station-marker" style="background: ${this.styles.station.fillColor}"></div>
                    <span>Charging Station</span>
                </div>
            `;
            return div;
        };
        
        legend.addTo(this.map);
    }

    initializeEventHandlers() {
        // Handle zoom events for marker size adjustment
        this.map.on('zoomend', () => this.adjustMarkerSize());
        
        // Handle map click events
        this.map.on('click', () => {
            if (this.app.state.selectingLocation) {
                // Handle manual location selection if enabled
                const center = this.map.getCenter();
                this.app.controlManager.handleLocationSelect({
                    lat: center.lat,
                    lng: center.lng
                });
            }
        });
    }

    updateStations(stations) {
        this.layers.stations.clearLayers();
        
        stations.forEach(station => {
            const marker = L.circleMarker(
                [station.geometry.coordinates[1], station.geometry.coordinates[0]],
                this.styles.station
            );
            
            marker.bindPopup(() => Utils.createStationPopupContent(station));
            
            marker.on('click', () => this.handleStationClick(station));
            
            this.layers.stations.addLayer(marker);
        });
    }

    updateCorridors(corridors) {
        this.layers.readyCorridors.clearLayers();
        this.layers.pendingCorridors.clearLayers();
        
        corridors.forEach(corridor => {
            const coordinates = corridor.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const isReady = corridor.properties.status === 'ready';
            const layer = isReady ? this.layers.readyCorridors : this.layers.pendingCorridors;
            const style = isReady ? this.styles.readyCorridor : this.styles.pendingCorridor;
            
            const polyline = L.polyline(coordinates, style)
                .bindPopup(() => Utils.createCorridorPopupContent(corridor));
            
            layer.addLayer(polyline);
        });
    }

    handleStationClick(station) {
        const state = this.app.state;
        
        if (!state.startStation) {
            this.app.updateState({ startStation: station });
            this.updateSelectedStations();
        } else if (!state.endStation) {
            this.app.updateState({ endStation: station });
            this.updateSelectedStations();
            this.app.calculateRoute();
        } else {
            // Reset selection if both stations are already selected
            this.app.updateState({
                startStation: station,
                endStation: null
            });
            this.updateSelectedStations();
        }
    }

    updateSelectedStations() {
        this.layers.selectedStations.clearLayers();
        const state = this.app.state;
        
        if (state.startStation) {
            const startMarker = L.circleMarker(
                [state.startStation.geometry.coordinates[1], 
                 state.startStation.geometry.coordinates[0]],
                this.styles.selectedStation
            ).bindPopup('Start: ' + state.startStation.properties.name);
            
            this.layers.selectedStations.addLayer(startMarker);
        }
        
        if (state.endStation) {
            const endMarker = L.circleMarker(
                [state.endStation.geometry.coordinates[1], 
                 state.endStation.geometry.coordinates[0]],
                {...this.styles.selectedStation, fillColor: '#DC2626'}
            ).bindPopup('End: ' + state.endStation.properties.name);
            
            this.layers.selectedStations.addLayer(endMarker);
        }
    }

    displayRoute(routeData) {
        this.layers.route.clearLayers();
        
        if (routeData && routeData.coordinates) {
            const route = L.polyline(
                routeData.coordinates.map(coord => [coord[1], coord[0]]),
                this.styles.route
            );
            
            this.layers.route.addLayer(route);
            this.map.fitBounds(route.getBounds(), { padding: [50, 50] });
        }
    }

    adjustMarkerSize() {
        const zoom = this.map.getZoom();
        const newRadius = Math.max(4, Math.min(8, zoom - 4));
        
        const adjustLayer = (layer) => {
            layer.eachLayer(marker => {
                if (marker instanceof L.CircleMarker) {
                    marker.setRadius(newRadius);
                }
            });
        };
        
        adjustLayer(this.layers.stations);
        adjustLayer(this.layers.selectedStations);
    }

    toggleLayer(layerName, visible) {
        const layer = this.layers[layerName];
        if (layer) {
            if (visible) {
                layer.addTo(this.map);
            } else {
                this.map.removeLayer(layer);
            }
        }
    }

    clearRoute() {
        this.layers.route.clearLayers();
    }

    resetView() {
        this.map.setView([39.8283, -98.5795], 4);
    }
}