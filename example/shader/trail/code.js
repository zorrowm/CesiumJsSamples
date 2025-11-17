import Trail from "./Trail.js";

const { DebugModelMatrixPrimitive, TileMapServiceImageryProvider } = window.Cesium;

const viewer = new Cesium.Viewer("cesiumContainer", {
    infoBox: false, //Disable InfoBox widget
    selectionIndicator: false, //Disable selection indicator
    shouldAnimate: true, // Enable animations
    terrain: Cesium.Terrain.fromWorldTerrain(),
    scene3DOnly: true
});

//Enable lighting based on the sun position
viewer.scene.globe.enableLighting = true;

//Enable depth testing so things behind the terrain disappear.
viewer.scene.globe.depthTestAgainstTerrain = true;

//Set the random number seed for consistent results.
Cesium.Math.setRandomNumberSeed(3);

//Set bounds of our simulation time
const start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
const stop = Cesium.JulianDate.addSeconds(start, 360, new Cesium.JulianDate());

//Make sure viewer is at the desired time.
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
viewer.clock.multiplier = 1;

//Set timeline to simulation bounds
viewer.timeline.zoomTo(start, stop);

//Generate a random circular pattern with varying heights.
function computeCirclularFlight(lon, lat, radius) {
    const property = new Cesium.SampledPositionProperty();

    for (let i = 0; i <= 360; i += 45) {
        const radians = Cesium.Math.toRadians(i);
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const position = Cesium.Cartesian3.fromDegrees(lon + radius * 1.5 * Math.cos(radians), lat + radius * Math.sin(radians), Cesium.Math.nextRandomNumber() * 500 + 1750);
        property.addSample(time, position);

        //Also create a point for each sample we generate.
        viewer.entities.add({
            position: position,
            point: {
                pixelSize: 8,
                color: Cesium.Color.TRANSPARENT,
                outlineColor: Cesium.Color.YELLOW,
                outlineWidth: 3
            }
        });
    }

    return property;
}

//Compute the entity position property.
const position = computeCirclularFlight(-112.110693, 36.0994841, 0.03);

//Actually create the entity
const planeEntity = viewer.entities.add({
    show: true,
    //Set the entity availability to the same interval as the simulation time.
    availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
            start: start,
            stop: stop
        })
    ]),

    //Use our computed positions
    position: position,

    //Automatically compute orientation based on position movement.
    orientation: new Cesium.VelocityOrientationProperty(position),

    //Load the Cesium plane model to represent the entity
    model: {
        uri: "./assets/models/Cesium_Air.glb",
        minimumPixelSize: 1,
        scale: 1
    },

    //Show the path as a pink line sampled in 1 second increments.

    path: {
        width: 1
    }
});

viewer.trackedEntity = planeEntity;

const scene = viewer.scene;

const trail = new Trail(scene, planeEntity, viewer.clock);
scene.primitives.add(trail);

const debugModelMatrixPrimitive = new DebugModelMatrixPrimitive({
    length: 100.0,
    width: 3.0
});

scene.primitives.add(debugModelMatrixPrimitive);

viewer.clock.onTick.addEventListener((e) => {
    const time = viewer.clock.currentTime;

    const modelMatrix = planeEntity.computeModelMatrix(time, new Cesium.Matrix4());

    debugModelMatrixPrimitive.modelMatrix = modelMatrix;
});
