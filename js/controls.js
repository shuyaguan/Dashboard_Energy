// controls.js - User interface control management

import { Utils } from './utils.js';

export class ControlManager {
    constructor(app) {
        this.app = app;
        
        // Cache DOM elements
        this.elements = {
            stateSelect: document.getElementById('state-select'),
            fuelSelect: document.getElementById('fuel-select'),
            showStations: document.getElementById('show-stations'),
            showCorridors: document.getElementById('show-corridors'),
            advancedPreferences: document.getElementById('advanced-preferences'),
            startStationDisplay: document.getElementById('start-station-display'),
            endStationDisplay: document.getElementById('end-station-display'),
            startStationInfo: document.getElementById('start-station-info'),
            endStationInfo: document.getElementById('end-station-info')
        };
        
        this.initialize();
    }

    initialize() {
        this.populateStateSelect();
        this.initializeEventListeners();
    }

    populateStateSelect() {
        const states = this.getUniqueStates();
        
        states.sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            this.elements.stateSelect.appendChild(option);
        });
    }

    getUniqueStates() {
        return [...new Set([
            ...this.app.state.stations.map(station => station.properties.state),
            ...this.app.state.corridors.flatMap(corridor => corridor.properties.states)
        ])];
    }

    initializeEventListeners() {
        // State selection change
        this.elements.stateSelect.addEventListener('change', (e) => {
            this.app.updateFilters({
                state: e.target.value
            });
        });

        // Fuel type selection change
        this.elements.fuelSelect.addEventListener('change', (e) => {
            this.app.updateFilters({
                fuelType: e.target.value
            });
        });

        // Layer visibility toggles
        this.elements.showStations.addEventListener('change', (e) => {
            this.app.mapManager.toggleLayer('stations', e.target.checked);
            this.app.updateState({ showStations: e.target.checked });
        });

        this.elements.showCorridors.addEventListener('change', (e) => {
            this.app.mapManager.toggleLayer('readyCorridors', e.target.checked);
            this.app.mapManager.toggleLayer('pendingCorridors', e.target.checked);
            this.app.updateState({ showCorridors: e.target.checked });
        });

        // Advanced preferences toggle
        this.elements.advancedPreferences.addEventListener('change', (e) => {
            this.toggleAdvancedOptions(e.target.checked);
        });
    }

    toggleAdvancedOptions(show) {
        const container = document.getElementById('advanced-options');
        
        if (show && !container) {
            const advancedOptions = this.createAdvancedOptionsElement();
            this.elements.advancedPreferences.parentNode.after(advancedOptions);
        } else if (!show && container) {
            container.remove();
        }
    }

    createAdvancedOptionsElement() {
        const container = document.createElement('div');
        container.id = 'advanced-options';
        container.className = 'advanced-options';
        
        container.innerHTML = `
            <div class="form-group">
                <label>
                    <input type="checkbox" id="prefer-ready-corridors" checked>
                    Prefer Ready Corridors
                </label>
            </div>
            <div class="form-group">
                <label for="max-distance">Maximum Distance Between Stations</label>
                <div class="range-container">
                    <input type="range" id="max-distance" 
                           min="25" max="100" value="50" step="25">
                    <span id="max-distance-value">50 miles</span>
                </div>
            </div>
        `;
        
        // Add event listeners for new controls
        container.querySelector('#max-distance').addEventListener('input', (e) => {
            const value = e.target.value;
            container.querySelector('#max-distance-value').textContent = `${value} miles`;
            this.app.updateState({
                routePreferences: {
                    ...this.app.state.routePreferences,
                    maxDistance: parseInt(value)
                }
            });
        });
        
        container.querySelector('#prefer-ready-corridors').addEventListener('change', (e) => {
            this.app.updateState({
                routePreferences: {
                    ...this.app.state.routePreferences,
                    preferReadyCorridors: e.target.checked
                }
            });
        });
        
        return container;
    }

    updateUI(state) {
        // Update station displays
        if (state.startStation) {
            this.elements.startStationDisplay.textContent = state.startStation.properties.name;
            this.updateStationInfo(state.startStation, this.elements.startStationInfo);
        } else {
            this.elements.startStationDisplay.textContent = 'Select a station on the map';
            this.elements.startStationInfo.textContent = '';
        }
        
        if (state.endStation) {
            this.elements.endStationDisplay.textContent = state.endStation.properties.name;
            this.updateStationInfo(state.endStation, this.elements.endStationInfo);
        } else {
            this.elements.endStationDisplay.textContent = 'Select a station on the map';
            this.elements.endStationInfo.textContent = '';
        }
        
        // Update filter controls
        this.elements.stateSelect.value = state.selectedState;
        this.elements.fuelSelect.value = state.selectedFuelType;
        this.elements.showStations.checked = state.showStations;
        this.elements.showCorridors.checked = state.showCorridors;
    }

    updateStationInfo(station, element) {
        const props = station.properties;
        element.innerHTML = `
            <div class="station-info-detail">
                <p><strong>Status:</strong> ${props.status}</p>
                <p><strong>Fuel Types:</strong> ${props.fuelTypes.join(', ')}</p>
                ${props.connectorTypes.length ? 
                    `<p><strong>Connectors:</strong> ${props.connectorTypes.join(', ')}</p>` : ''}
                <p><strong>Hours:</strong> ${props.availability}</p>
            </div>
        `;
    }

    handleLocationSelect(location) {
        // Handle manual location selection if implemented
        console.log('Location selected:', location);
    }
}