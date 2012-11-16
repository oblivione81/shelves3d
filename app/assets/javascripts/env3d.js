/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 16/11/12
 * Time: 12.38
 * To change this template use File | Settings | File Templates.
 */
//= require three
//= require ColladaLoader


var env3d_scene, env3d_camera, env3d_renderer;

function __onModelLoaded(res)
{
    dae = res.scene;
    dae.scale.set(0.1, 0.1, 0.1);
    dae.position.set(0.0, 0.0, 0.0)
    env3d_scene.add(dae);

    env3d_render();
}

function __loadModel()
{
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load( '../billy.dae', __onModelLoaded);
}


function env3d_init(width, height, elementId)
{
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 0.001, 1000);

    rendering_canvas = document.getElementById(elementId);

    env3d_renderer = new THREE.WebGLRenderer({antialias:true, canvas:rendering_canvas});

    env3d_renderer.setSize(width, height);
    //div_rendering_canvas.appendChild(env3d_renderer.domElement);

    //---------------------------------------------------------
    //GROUND
    var ground_geometry = new THREE.CubeGeometry(20,0.1,20);
    var ground_material = new THREE.MeshBasicMaterial({color: 0xaaaaaa});
    var ground  = new THREE.Mesh(ground_geometry, ground_material);
    env3d_scene.add(ground);
    ground.position.set(0, 0, 0);

    //---------------------------------------------------------
    //LIGTHS
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.castShadow = true;
    directionalLight.position.set( 3, 5, 5 );
    env3d_scene.add( directionalLight );
    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.castShadow = true;
    directionalLight.position.set( 5, 5, 2 );
    env3d_scene.add( directionalLight );

    //----------------------------------------------------------
    //CAMERA
    env3d_camera.position.set(4, 11, 9);
    env3d_camera.lookAt(new THREE.Vector3(0, 2, 0))

    __loadModel();
}

function env3d_render()
{
    requestAnimationFrame(env3d_render);
    env3d_renderer.render(env3d_scene, env3d_camera);
}

