import { Source, Layer } from 'react-map-gl/mapbox'

export default function HeatmapLayer({
  heatmapData
}) {

  return (

    <Source
      id="fleet-heatmap"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: heatmapData.map((point) => ({
          type: 'Feature',
          properties: {
            intensity: point.intensity
          },
          geometry: {
            type: 'Point',
            coordinates: [
              point.longitude,
              point.latitude
            ]
          }
        }))
      }}
    >

      <Layer
        id="heatmap-layer"
        type="heatmap"
        paint={{
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            0,
            1,
            1
          ],

          'heatmap-intensity': 1.5,

          'heatmap-radius': 45,

          'heatmap-opacity': 0.7,

          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,255,0)',
            0.2,
            '#22d3ee',
            0.4,
            '#3b82f6',
            0.6,
            '#a855f7',
            0.8,
            '#ec4899',
            1,
            '#ef4444'
          ]
        }}
      />

    </Source>
  )
}