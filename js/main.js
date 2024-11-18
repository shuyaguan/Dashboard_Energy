// Main application entry point
import { apiService } from './api.js';
import { Utils } from './utils.js';
import { MapManager } from './map.js';
import { ControlManager } from './controls.js';
import { RoutingManager } from './routing.js';

class App {
    constructor() {
        this.apiService = apiService;
        this.mapManager = null;
        this.controlManager = null;
        this.routingManager = null;
        
        // Application state
        this.state = {
            selectedState: 'all',
            selectedFuelType: 'ELEC',
            showStations: true,
            showCorridors: true,
            startStation: null,
            endStation: null,
            routePreferences: {
                maxDistance: 50,
                preferReadyCorridors: true
            }
        };
    }

    async initialize() {
        try {
            Utils.showLoading();

            // Initialize managers
            this.mapManager = new MapManager(this);
            this.controlManager = new ControlManager(this);
            this.routingManager = new RoutingManager(this);

            // Initial data load
            await this.loadInitialData();

            // Initialize UI components
            await this.initializeUI();

            Utils.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.hideLoading();
            Utils.showError('Error initializing application. Please try again.');
        }
    }

    async loadInitialData() {
        try {
            const [stations, corridors] = await Promise.all([
                this.apiService.getStationsByState(this.state.selectedState, {
                    fuelType: this.state.selectedFuelType
                }),
                this.apiService.getCorridors({
                    fuelType: this.state.selectedFuelType
                })
            ]);

            // Update map with initial data
            this.mapManager.updateStations(stations.map(Utils.formatStationData));
            this.mapManager.updateCorridors(corridors.map(Utils.formatCorridorData));
        } catch (error) {
            console.error('Error loading initial data:', error);
            // Fall back to cached data
            this.loadCachedData();
        }
    }

    loadCachedData() {
        this.mapManager.updateStations(stationData.features);
        this.mapManager.updateCorridors(corridorData.features);
        Utils.showError('Using cached data due to connection issues.');
    }

    async initializeUI() {
        // Initialize event listeners
        this.controlManager.initializeEventListeners();
        
        // Update UI based on initial state
        this.controlManager.updateUI(this.state);
    }

    // State management methods
    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.controlManager.updateUI(this.state);
    }

    async updateFilters(filters) {
        Utils.showLoading();
        try {
            const stations = await this.apiService.getStationsByState(
                filters.state,
                { fuelType: filters.fuelType }
            );
            this.mapManager.updateStations(stations.map(Utils.formatStationData));
            this.updateState(filters);
        } catch (error) {
            console.error('Error updating filters:', error);
            Utils.showError('Error updating filters. Please try again.');
        } finally {
            Utils.hideLoading();
        }
    }

    // Route calculation
    async calculateRoute() {
        if (!this.state.startStation || !this.state.endStation) {
            Utils.showError('Please select both start and end stations.');
            return;
        }

        Utils.showLoading();
        try {
            const route = await this.apiService.getRoute(
                {
                    lat: this.state.startStation.geometry.coordinates[1],
                    lng: this.state.startStation.geometry.coordinates[0]
                },
                {
                    lat: this.state.endStation.geometry.coordinates[1],
                    lng: this.state.endStation.geometry.coordinates[0]
                },
                this.state.routePreferences
            );

            this.routingManager.displayRoute(route);
        } catch (error) {
            console.error('Error calculating route:', error);
            Utils.showError('Error calculating route. Please try again.');
        } finally {
            Utils.hideLoading();
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});