<template>
    <div id="layout" class="d-flex">
        <!-- Map container -->
        <div ref="mapContainer" class="map-container">
            <Map v-model="location" :mapLayers="mapLayers" ref="webMap" />
        </div>
        <div id="sidebar" class="container" style="max-height: 80vh; overflow-y: auto;">
            <v-card variant="flat" class="mx-auto bg-secondary on-secondary" max-width="450">
                <v-tabs
                    v-model="tab"
                    bg-color="primary"
                    align-tabs="center"
                >
                    <v-tab value="zone">Zonificación</v-tab>
                    <v-tab value="place">Lugar</v-tab>
                    <v-tab value="coordinate">Coordenada</v-tab>
                </v-tabs>
                <v-card-text>
                    <v-window v-model="tab">
                        <v-window-item value="place">
                            <v-form>
                                <v-row class="d-flex align-center justify-space-between">
                                    <v-col cols="10">
                                        <!--v-text-field label="Lugar" prepend-icon="mdi-map-marker"></v-text-field-->
                                        <v-autocomplete
                                            v-model="selectedPlace"
                                            :items="placeNames"
                                            label="Buscar lugar"
                                            item-text="nombre"
                                            item-value="nombre"
                                        ></v-autocomplete>
                                    </v-col>
                                    <v-col cols="2">
                                        <v-btn id="search-place" size="x-small" icon="mdi-map-search" color="accent" @click="filterAndEmit"></v-btn>
                                    </v-col>
                                </v-row>
                            </v-form>
                            <div class="text-caption">
                                {{ labels[0] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation.lat.toFixed(2)) : parseFloat(location.lat.toFixed(2)) }} |
                                {{ labels[1] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation.lng.toFixed(2)) : parseFloat(location.lng.toFixed(2)) }} |
                                Zoom: {{ location.zoom.toFixed(2) }} 
                                <template v-if="location.bearing">| Bearing: {{ location.bearing.toFixed(2) }} | </template>
                                <template v-if="location.pitch"> Pitch: {{ location.pitch.toFixed(2) }} | </template>
                            </div>
                        </v-window-item>
                        <v-window-item value="coordinate">
                            <v-row class="d-flex align-center justify-space-between">
                                <v-col cols="5">
                                    <v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
                                        <v-text-field
                                        v-model="reprojectedLocation.lat"
                                        :label="labels[0]"
                                        :rules="rules"
                                        ></v-text-field>
                                    </v-form>
                                    <v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
                                        <v-text-field
                                        v-model="location.lat"
                                        :label="labels[0]"
                                        :rules="rules"
                                        ></v-text-field>
                                    </v-form>
                                </v-col>
                                <v-col cols="5">
                                    <v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
                                        <v-text-field
                                        v-model="reprojectedLocation.lng"
                                        :label="labels[1]"
                                        :rules="rules"
                                        ></v-text-field>
                                    </v-form>
                                    <v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
                                        <v-text-field
                                        v-model="location.lng"
                                        :label="labels[1]"
                                        :rules="rules"
                                        ></v-text-field>
                                    </v-form>
                                </v-col>
                                <v-col cols="2">
                                    <v-btn id="search-coordinate" size="x-small" icon="mdi-crosshairs-question" color="accent" @click="reprojectAndEmit"></v-btn>
                                </v-col>
                            </v-row>
                        </v-window-item>
                        <v-window-item value="zone">
                            <v-form>
                                <v-row class="d-flex align-center justify-space-between">
                                    <v-col cols="10">
                                        <!--v-text-field label="Lugar" prepend-icon="mdi-map-marker"></v-text-field-->
                                        <v-autocomplete
                                            v-model="selectedZone"
                                            :items="zoneNames"
                                            label="Buscar Zona"
                                            item-title="name"
                                            item-value="value"
                                        ></v-autocomplete>
                                    </v-col>
                                    <v-col cols="2">
                                        <v-btn id="search-zone" size="x-small" icon="mdi-filter" color="accent" @click="filterZoneAndEmit"></v-btn>
                                    </v-col>
                                </v-row>
                            </v-form>
                        </v-window-item>
                    </v-window>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-title>
                    <v-row class="d-flex align-center justify-space-between">
                        <v-col cols="10">
                            <div class="text-h6 mb-1">Capas</div>
                        </v-col>
                        <v-col cols="2">
                            <v-icon left>mdi-layers</v-icon>
                        </v-col>
                    </v-row>
                </v-card-title>
                <v-card-text style="max-height: 400px; overflow-y: auto;">
                    <!--Layers panel-->
                    <v-expansion-panels>
                        <v-expansion-panel v-for="(group, category) in groupedLayers" :key="category" class="v-card">
                            <v-expansion-panel-title>{{ category }}</v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <!--Layers and controls-->
                                    <section>
                                        <details v-for="layer in group" :key="layer.id">
                                            <summary>{{ layer.dataset.title }}</summary>
                                            <p class="text-caption">{{ layer.dataset.abstract }}</p>
                                            <div class="layer-controls">
                                                <v-slider class="layer-opacity" color="accent" min=0 max=1 v-model="layer.opacity" :disabled="!layer.visibility"></v-slider>
                                                <v-switch class="layer-visibility" color="accent" v-model="layer.visibility" ></v-switch>
                                            </div>
                                            <div class="legend overflow-y-auto">
                                                <!--v-img :src="layer.dataset.links[0].url" width="70%" contain ></v-img-->
                                                <v-img :src="layer.dataset.links[0].url" :width="getLegendWidth(layer.dataset.links[0].url)" contain></v-img>
                                            </div>
                                        </details>
                                    </section>
                                </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-row class="d-flex align-center justify-space-between">
                        <v-col cols="10">
                            <v-select
                                v-model="currentCRS"
                                :items="items"
                                :item-props="itemProps"
                                label="Seleccione Sistema de Referencia"
                            ></v-select>
                        </v-col>
                        <v-col cols="2">
                            <v-btn size="small" icon="mdi-home" @click="location = { lng: -71.6930587033, lat: 10.6775887114, zoom: 11.6, pitch: 0, bearing: 0 }" color="accent"></v-btn>
                        </v-col>
                    </v-row>
                </v-card-actions>
            </v-card>
        </div>
    </div>
</template>

<script>
import proj4 from 'proj4';
import { mapState } from 'vuex';

import Map from "@/components/WebMap.vue";
import "mapbox-gl/dist/mapbox-gl.css";

export default {
    name: "MapView",
    components: {
        Map,
    },
    data() {
        // Define the EPSG:2202 projection
        proj4.defs("EPSG:2202", "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
        return {
            currentCRS: 'EPSG:2202',
            items: [
                { text: 'WGS84', value: 'EPSG:4326' },
                { text: 'REGVEN', value: 'EPSG:2202' },
            ],
            session: {
                name: 'Sistema de Información Territorial - SIT',
                site: 'Visor de Mapas | Consulta Ciudadana',
                details: 'Alcaldía de Maracaibo - Centro de Procesamiento Urbano (CPU)',
                logoPath: require('@/assets/alcaldia-de-maracaibo-logo-web.png'),
                // map name fetched from GeoNode API
                map: 'Ordenanza de Zonificación Urbana',

            },
            location: {
                lng: -71.6930587033,
                lat: 10.6775887114,
                bearing: 0,
                pitch: 0,
                zoom: 11.6,
            },
            reprojectedLocation: {
                lng: 205383.1024547202,
                lat: 1181614.2195329086,
            },
            rules: [
                value => {
                    if (value) return true
                    return 'Coordenada requerida'
                },
            ],
            tab: null,
            imageDimensions: {},
            selectedPlace: null,
            selectedZone: null,
        };
    },
    computed: {
        ...mapState(['mapLayers', 'selectedMap', 'searchFeatures', 'filterFeatures', 'mapDatasets']),
        placeNames() {
            return this.searchFeatures.map(feature => {
            if (typeof feature.properties.comunidad !== 'string') {
                console.warn('Invalid comunidad property:', feature.properties.comunidad);
            }
            //console.log(feature.properties.comunidad);
            return feature.properties.comunidad;
            });
        },
        zoneNames() {
            const zones = [];

            if (this.filterFeatures && this.filterFeatures.length > 0) {
                const uniqueZones = this.filterFeatures
                    .map(feature => {
                        if (feature.properties.nombre_zona && feature.properties.zona) {
                            return {
                                name: `${feature.properties.nombre_zona} - ${feature.properties.zona}`,
                                value: feature.properties.nombre_zona
                            };
                        }
                        return null;
                    }) // map to object with name and value properties
                    .filter((value, index, self) => value && self.findIndex(v => v.name === value.name && v.value === value.value) === index); // filter out nulls and duplicates

                uniqueZones.forEach(zone => {
                    zones.push(zone);
                });
            }
            return zones;
        },
        groupedLayers() {
            const groups = this.mapLayers.reduce((groups, layer) => {
                if (layer.dataset && layer.dataset.category) {
                    let category;
                    if (layer.dataset.category.identifier === 'boundaries') {
                        category = 'Límites';
                    } else if (layer.dataset.category.identifier === 'planningCadastre') {
                        category = 'Ordenamiento';
                    } else if (layer.dataset.category.identifier === 'transportation') {
                        category = 'Vías';
                    } else {
                        category = layer.dataset.category.identifier;
                    }

                    if (!groups[category]) {
                        groups[category] = [];
                    }
                    groups[category].push(layer);
                }
                return groups;
            }, {});

            //console.log(groups);  // Log `groupedLayers` in the console

            return groups;
        },
        labels() {
            if (this.currentCRS === 'EPSG:2202') {
                return ['Norte', 'Este'];
            } else if (this.currentCRS === 'EPSG:4326') {
                return ['Latitude', 'Longitude'];
            }
            return [];
        },
    },
    mounted() {
        this.mapLayers = this.$store.state.mapLayers;  // Update `mapLayers` with the actual map layers from the Vuex store
    },
    watch: {
        location(newLocation) {
            // Reproject the coordinates to EPSG:2202 whenever the location changes
            const [lng, lat] = proj4('EPSG:4326', 'EPSG:2202', [newLocation.lng, newLocation.lat]);
            this.reprojectedLocation = { lng, lat };
        },
    },
    methods: {
        itemProps(item) {
            return {
                title: item.text,
                subtitle: item.value,
            };
        },
        switchCRS(crs) {
            this.currentCRS = crs;
            const convertedLocation = proj4(this.crs['EPSG:4326'], this.crs[this.currentCRS], [this.location.lng, this.location.lat]);
            this.location.lng = convertedLocation[0];
            this.location.lat = convertedLocation[1];
        },
        openDetails(detailUrl) {
            window.open(`${detailUrl}/metadata_detail`, '_blank');
        },
        reprojectAndEmit() {
            if (this.currentCRS === 'EPSG:2202') {
                const sourceProjection = 'EPSG:2202'; // adjust this value as needed
                const targetProjection = 'EPSG:4326';
                const [reprojectedLng, reprojectedLat] = proj4(sourceProjection, targetProjection, [parseFloat(this.reprojectedLocation.lng), parseFloat(this.reprojectedLocation.lat)]);
                this.$refs.webMap.addMarker({ lngLat: { lat: reprojectedLat, lng: reprojectedLng } });
            } else {
                this.$refs.webMap.addMarker({ lngLat: { lat: parseFloat(this.location.lat), lng: parseFloat(this.location.lng) } });
            }
        },
        getLegendWidth(url) {
            if (this.imageDimensions[url]) {
            return this.imageDimensions[url].width > this.imageDimensions[url].height ? '50%' : '80%';
            } else {
            let img = new Image();
            img.onload = () => {
                this.imageDimensions[url] = { width: img.width, height: img.height };
            };
            img.src = url;
            }
        },
        filterAndEmit() {
            const filteredFeatures = this.searchFeatures.filter(feature => feature.properties.nombre === this.selectedPlace);
            console.log(filteredFeatures);
            filteredFeatures.forEach(feature => {
                const [lng, lat] = feature.geometry.coordinates;
                const lngLat = { lat, lng };
                console.log(lngLat);
                this.$refs.webMap.addMarker({ lngLat: lngLat });
            });
        },
        filterZoneAndEmit() {
            const filteredFeatures = this.filterFeatures.filter(feature => feature.properties.nombre_zona === this.selectedZone);
            console.log(filteredFeatures);

            if (filteredFeatures && filteredFeatures.length > 0) {
                const mergedGeometry = {
                    type: "GeometryCollection",
                    geometries: filteredFeatures.map(feature => feature.geometry)
                };

                this.$store.dispatch('traceFeature', mergedGeometry);
            }
        },

    },
};
</script>

<style scoped>
.map-container {
  flex-grow: 1;
  height: calc(100vh - 64px);
  width: 100%;
  position: relative;
}

.container {
    z-index: 1;
}

#sidebar {
  position: absolute;
  margin: 30px;
  /* specify top, left, width, and height as needed */
}

.overflow-y-auto {
  overflow-y: auto;
  max-height: 100px; /* Adjust this value as needed */
}

.layer-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.layer-opacity {
  width: 70%;
}

.layer-visibility {
  margin-left: 30px;
}
</style>